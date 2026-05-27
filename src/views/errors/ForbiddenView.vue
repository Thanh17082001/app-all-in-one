<template>
  <div class="forbidden-container">
    <div class="forbidden-content">
      <h1 class="forbidden-code">403</h1>
      <h2 class="forbidden-title">Access Forbidden</h2>
      <p class="forbidden-message">You don't have permission to access this resource.</p>
      <router-link to="/admin/dashboard" class="forbidden-button">
        Back to Home
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForbiddenView',
  meta: {
    title: '403 - Forbidden'
  }
}
</script>

<style scoped>
.forbidden-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.forbidden-content {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.forbidden-code {
  font-size: 120px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
  line-height: 1;
}

.forbidden-title {
  font-size: 32px;
  color: #333;
  margin: 20px 0 10px;
}

.forbidden-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px;
}

.forbidden-button {
  display: inline-block;
  background-color: #667eea;
  color: white;
  padding: 12px 30px;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.forbidden-button:hover {
  background-color: #764ba2;
}
</style>
