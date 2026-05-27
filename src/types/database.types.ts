export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            roles: {
                Row: {
                    id: number
                    uuid: string
                    name: string
                    description: string | null
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: number
                    uuid?: string
                    name: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: number
                    uuid?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Relationships: []
            }
            expense_types: {
                Row: {
                    id: number
                    uuid: string
                    name: string
                    description: string | null
                    user_id: string | null
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: number
                    uuid?: string
                    name: string
                    description?: string | null
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: number
                    uuid?: string
                    name?: string
                    description?: string | null
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Relationships: []
            }
            tests: {
                Row: {
                    id: number
                    uuid: string
                    name: string
                    user_id: string
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: number
                    uuid?: string
                    name: string
                    user_id?: string
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: number
                    uuid?: string
                    name?: string
                    user_id?: string
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'tests_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    username: string
                    fullname: string | null
                    email: string
                    role_id: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username: string
                    fullname?: string | null
                    email: string
                    role_id?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    fullname?: string | null
                    email?: string
                    role_id?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'profiles_role_id_fkey'
                        columns: ['role_id']
                        isOneToOne: false
                        referencedRelation: 'roles'
                        referencedColumns: ['id']
                    },
                ]
            }
        }
        Views: Record<string, never>
        Functions: {
            get_login_email: {
                Args: { p_username: string }
                Returns: string
            }
            get_access_subjects: {
                Args: Record<PropertyKey, never>
                Returns: string[]
            }
        }
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
}
