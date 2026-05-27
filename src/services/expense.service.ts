import { supabase } from '@/lib/supabase'
import { BaseService } from './base.service'
import { toOwnedEntity } from '@/lib/db-mappers'
import { throwIfError, SupabaseServiceError } from '@/lib/supabase-error'
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import type { Expense, CreateExpensePayload, UpdateExpensePayload, ExpenseQueryParams } from '@/types/expense.types'
import type { PaginatedResponse } from '@/types'

const mapExpense = (row: any): Expense => ({
    ...toOwnedEntity(row),
    title: row.title,
    amount: Number(row.amount),
    note: row.note,
    transaction_date: row.transaction_date,
    transaction_type: row.transaction_type,
    type_id: row.type_id,
    expense_types: row.expense_types,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
})

const base = new BaseService<Expense>('expenses', mapExpense)

export const expenseService = {
    getAll: async (params?: ExpenseQueryParams): Promise<PaginatedResponse<Expense>> => {
        // Join với bảng loại chi phí để lấy tên hiển thị
        const selectStr = '*, expense_types(name), profiles(username)'
        return base.getPaginated(params ?? { page: 1, limit: 10, sortOrder: 'DESC' }, selectStr, (query) => {
            // Lọc theo Loại (Thu nhập / Chi tiêu) - Chỉ lọc nếu khác 'all'
            if (params?.transaction_type && params.transaction_type !== 'all') {
                query = query.eq('transaction_type', params.transaction_type)
            }
            // Lọc theo Danh mục - Kiểm tra cả trường hợp 'all' dạng string
            if (params?.type_id && (params.type_id as any) !== 'all') {
                query = query.eq('type_id', params.type_id)
            }
            // Lọc theo Ngày giao dịch
            if ((params as any)?.transaction_date && (params as any).transaction_date !== '') {
                query = query.eq('transaction_date', (params as any).transaction_date)
            }
            // Lọc theo Tháng giao dịch (YYYY-MM)
            if ((params as any)?.transaction_month && (params as any).transaction_month !== '') {
                const month = (params as any).transaction_month;
                const [y, m] = month.split('-').map(Number);
                const startDate = `${month}-01`;
                const endDate = new Date(y, m, 1).toISOString().split('T')[0]; // Ngày đầu tiên của tháng sau
                query = query.gte('transaction_date', startDate).lt('transaction_date', endDate);
            }
            // Lọc theo Cá nhân - Xử lý 'all', 'system' và UUID người dùng
            if (params?.userIdFilter && params.userIdFilter !== 'all') {
                if (params.userIdFilter === 'system') {
                    query = query.is('user_id', null)
                } else {
                    query = query.eq('user_id', params.userIdFilter)
                }
            }
            return query
        })
    },

    getById: (id: number) => base.getById(id, '*, expense_types(name)'),

    create: async (payload: CreateExpensePayload): Promise<Expense> => {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new SupabaseServiceError('Người dùng chưa đăng nhập.')
        }

        const { data, error } = await supabase
            .from('expenses' as any)
            .insert([{
                ...payload,
                user_id: user.id,
                amount: Math.abs(Number(payload.amount)) // Luôn lưu số dương vào DB
            }])
            .select('*, expense_types(name)')
            .single()

        const row = throwIfError(data, error)
        return mapExpense(row)
    },

    createBulk: async (payloads: CreateExpensePayload[]): Promise<Expense[]> => {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new SupabaseServiceError('Người dùng chưa đăng nhập.')
        }

        const insertData = payloads.map(p => ({
            ...p,
            user_id: user.id,
            amount: Math.abs(Number(p.amount))
        }))

        const { data, error } = await supabase
            .from('expenses' as any)
            .insert(insertData)
            .select('*, expense_types(name)')

        const rows = throwIfError(data, error)
        return rows.map(mapExpense)
    },

    scanReceipt: async (file: File, categories: any[]): Promise<any[]> => {
        try {
            // 1. Khởi tạo Gemini với Key của bạn (Nên dùng import.meta.env.VITE_GEMINI_KEY)
            // Lấy key từ biến môi trường với Vite
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

            // Cấu hình Schema để ép kiểu dữ liệu trả về
            const schema : Schema = {
                description: "List of items from receipt",
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        amount: { type: SchemaType.NUMBER },
                        category: { type: SchemaType.STRING },
                        note: { type: SchemaType.STRING },
                    },
                    required: ["name", "amount"],
                },
            };
    
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            // 2. Chuyển đổi File sang định dạng Base64 mà Gemini hiểu
            const readFileAsBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            };

            const base64Data = await readFileAsBase64(file);

            // Chuẩn bị danh sách danh mục để AI chọn
            const categoryList = categories.map(c => c.name).join(", ");

            // 3. Chuẩn bị Prompt chi tiết
            const prompt = `Bạn là một chuyên gia kế toán. Hãy trích xuất danh sách các món đồ/dịch vụ từ ảnh hóa đơn này. 
            Dựa trên danh sách các danh mục sau đây: [${categoryList}], hãy chọn danh mục phù hợp nhất cho mỗi món đồ.
            Yêu cầu nghiêm ngặt: 
            - Trả về kết quả duy nhất dưới dạng mảng JSON thuần túy. 
            - Định dạng: [{"name": string, "amount": number, "category": string, "note": string}]
            - "name" là tên món đồ.
            - "amount" là số tiền (chỉ lấy số).
            - "category" là TÊN danh mục phù hợp nhất lấy từ danh sách được cung cấp ở trên. Nếu không khớp cái nào, hãy để trống.
            - "note" là ghi chú thêm (nếu có).
            - Nếu là chữ viết tay khó đọc, hãy cố gắng dự đoán dựa trên ngữ cảnh.
            - KHÔNG giải thích gì thêm, chỉ trả về JSON.`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();
            console.log(text,'kkkk');
                      // 4. Parse text trả về thành JSON (cần dọn dẹp markdown nếu AI trả về ```json ...)
            const jsonMatch = text.match(/\[.*\]/s);
            if (!jsonMatch) throw new Error('AI không trả về đúng định dạng JSON');

            return JSON.parse(jsonMatch[0]);
        } catch (error: any) {
            console.error('Lỗi Gemini SDK:', error);
            throw new SupabaseServiceError('Không thể xử lý hóa đơn bằng Gemini trực tiếp.');
        }
    },

    update: async (id: number, payload: UpdateExpensePayload): Promise<Expense> => {
        const updateData = { ...payload }
        if (updateData.amount !== undefined && updateData.amount !== null) {
            updateData.amount = Math.abs(Number(updateData.amount))
        }

        const { data, error } = await supabase
            .from('expenses' as any)
            .update(updateData)
            .eq('id', id)
            .select('*, expense_types(name)')
            .single()

        const row = throwIfError(data, error)
        return mapExpense(row)
    },

    delete: (id: number) => base.deleteSoft(id)
}