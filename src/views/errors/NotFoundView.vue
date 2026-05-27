<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Page Not Found</h2>
      <p class="error-message">Sorry, the page you're looking for doesn't exist.</p>
      <router-link to="/admin/dashboard" class="back-button">Back to Home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',
  meta: {
    title: '404 - Page Not Found'
  }
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.not-found-content {
  text-align: center;
  background: white;
  border-radius: 10px;
  padding: 60px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
  line-height: 1;
}

.error-title {
  font-size: 32px;
  color: #333;
  margin: 20px 0 10px;
}

.error-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px;
}

.back-button {
  display: inline-block;
  padding: 12px 30px;
  background-color: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.back-button:hover {
  background-color: #764ba2;
}
</style>
