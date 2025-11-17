<template>
  <div class="login-container">
    <div class="login-header">
      <img src="@/assets/images/maureal.png"></img>
    </div>

    <div class="login-form">
      <h3>LOGIN PORTAL</h3>
      
      <div class="input-group">
        <input type="text" v-model="username" placeholder="Username">
      </div>

      <div class="input-group">
        <input type="password" v-model="password" placeholder="Password">
      </div>

      <button class="signin-btn" @click="handleLogin">Sign In</button>

      <div class="remember-me">
        <input type="checkbox" v-model="rememberMe">
        <label>Remember username</label>
      </div>

      <div class="privacy-notice">
        <a href="#">Data Privacy Act</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const rememberMe = ref(false)

const handleLogin = () => {
  // Login logic here
  router.push('/dashboard')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'Arial', sans-serif;
}

.login-header {
  text-align: center;
  height: 300px;
  width: 300px;
  margin-bottom: -200px;
}

.subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
}

.login-form {
  background: white;/*rgba(255, 255, 255, 0.1);*/
  padding: 2.5rem;
  border-radius: 5px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 300px;
  height: 350px;
  max-width: 90%;
}

.login-form h3 {
  text-align: center;
  margin-top: -20px;
  margin-bottom: 10px;
  font-size: 1.5rem;
  font-weight: 600;
  color: black;
}

.input-group {
  margin-bottom: 1rem;
  color: gray;
  border: solid, gray;
  border-radius: 10px;
  width: 250px;
  display: flex;
  margin-left: -16px;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  color: gray;
  padding: 20px;
  margin-left: -25px;
}

.signin-btn {
  padding: 12px;
  background: #27ae60;
  color: white;
  border: solid, gray;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 1;
  cursor: pointer;
  transition: transform 0.2s;
  width: 250px;
  margin-left: -16px;
}

.signin-btn:hover {
  transform: translateY(-2px);
}

.privacy-notice {
  text-align: center;
  margin-top: -40px;
  font-size: 0.9rem;
  opacity: 0.7;
  color: gray;
}
</style>