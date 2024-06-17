<template>
  <div class="login-page">
    <h1>Login</h1>
    <form @submit.prevent="login">
      <div>
        <label>Username:</label>
        <input v-model="username" type="text" required maxlength="50" />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required maxlength="50" />
      </div>
      <button type="submit">Login</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''  // Add this line to hold error messages
    };
  },
  methods: {
    login() {
      axios.post('/etherscan/login.php', { username: this.username, password: this.password })
        .then(response => {
          if (response.data.status === 'success') {
            localStorage.setItem('token', response.data.token);
            this.$router.push('/tool1');
            this.$emit('login-success');  // Emit the login-success event
          } else {
            this.errorMessage = response.data.message || 'Login failed. Please check your username and password.';
          }
        })
        .catch(error => {
          console.error('Error logging in:', error);
          this.errorMessage = 'An error occurred. Please try again later.';
        });
    }
  }
};
</script>

<style>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-message {
  color: #e74c3c;  /* Soft reddish pink color */
  margin-top: 10px;
}
</style>
