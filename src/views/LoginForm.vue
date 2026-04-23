<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/images/Maurealty.png" alt="Maurealty Logo" class="logo" />
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <h1>LOGIN PORTAL</h1>

        <div class="input-group">
          <input
            type="text"
            v-model="username"
            placeholder="Username"
            autocomplete="username"
          />
        </div>

        <div class="input-group">
          <input
            type="password"
            v-model="password"
            placeholder="Password"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="signin-btn">Sign In</button>

        <div class="remember-me">
          <input id="rememberMe" type="checkbox" v-model="rememberMe" />
          <label for="rememberMe">Remember username</label>
        </div>

        <div class="privacy-notice">
          <a href="#">Data Privacy Act</a>
        </div>
      </form>
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
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #16213e 50%, #1e3a5f 100%);
  font-family: Arial, sans-serif;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px 28px;
  box-sizing: border-box;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.login-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.logo {
  width: 180px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.login-form h1 {
  text-align: center;
  margin: 0 0 24px;
  font-size: 1.6rem;
  font-weight: 700;
  color: #111827;
}

.input-group {
  margin-bottom: 16px;
}

.input-group input {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-sizing: border-box;
  font-size: 1rem;
  color: #111827;
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-group input:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.15);
}

.signin-btn {
  width: 100%;
  padding: 13px;
  margin-top: 4px;
  border: none;
  border-radius: 10px;
  background: #27ae60;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.signin-btn:hover {
  background: #219150;
  transform: translateY(-1px);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #4b5563;
  font-size: 0.95rem;
}

.privacy-notice {
  text-align: center;
  margin-top: 18px;
  font-size: 0.9rem;
}

.privacy-notice a {
  color: #27ae60;
  text-decoration: none;
}

.privacy-notice a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    padding: 24px 18px;
    border-radius: 12px;
  }

  .logo {
    width: 150px;
  }

  .login-form h1 {
    font-size: 1.35rem;
  }
}
</style>
