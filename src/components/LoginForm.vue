<template>
    <div id="app">
      <div class="container">
      <div class="logo">
          <img :src="image" alt="maurealty" class="logoimg" />
        </div>
      </div>
      <div class="loginBox">
        <div class="loginText">
          <p class="title">{{ login }}</p>
        </div>
        <form @submit.prevent="handleLogin">
          <input
            type="text"
            v-model="username"
            placeholder="Username"
            class="input"
            required
          />
          <input
            type="password"
            v-model="password"
            placeholder="Password"
            class="input"
            required
          />
          <button type="submit" class="loginButton">Sign in</button>
        </form>
        <div class="remember">
      <input 
        type="checkbox" 
        id="rememberMe" 
        v-model="rememberMe" 
      />
      <label for="rememberMe">Remember username</label>
      </div>
    </div>
    </div>
  </template>
  
  
  <script>
  import image from "@/assets/maureal.png"
  export default {
    name: "LoginForm",
    data() {
      return {
        image : image,
        login: "LOG IN PORTAL",
        username: "",
        password: "",
        rememberMe: false
      };
    },
    methods: {
      handleLogin() {
        alert(`Username: ${this.username}\nPassword: ${this.password}`);
      },
    },
  };
  </script>
  
  <style>
  #app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  
  .container{ 
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  .remember{
    
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin-top: 25px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #333;
    margin-left: 0;
  }
  .loginBox {
    border: 1.5px solid #2c3e50;
    padding: 50px;
    background-color: #ffffff;
    border-radius: 8px;
    margin-top: -10px;
    margin-right: auto;
    margin-left: auto;
    width: 250px;
    text-align: center;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
  
  .title {
    font-family: sans-serif;
    color: black;
    font-size: 25px;
    font-weight: bold;
    margin-top: -20px;
    margin-bottom: 20px;
  }
  
  .input {
    width: 90%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 13px;
  }
  
  .loginButton {
    width: 97%;
    padding: 15px;
    background-color: #41BE01;
    color: white; 
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .loginButton:hover {
    background-color: pink;
  }
  .logoimg{
    height: 100px;
    object-fit: contain;
    margin-top: 100px;
  }
  </style>
  