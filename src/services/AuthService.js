// src/services/AuthService.js
import axios from 'axios';

const AuthService = {
  login(username, password) {
    return axios.post('/etherscan/login.php', { username, password })
      .then(response => {
        if (response.data.status === 'success') {
          localStorage.setItem('token', response.data.token);
          return true;
        } else {
          return false;
        }
      });
  },
  logout() {
    localStorage.removeItem('token');
  },
  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (token) {
      return axios.post('/etherscan/verify.php', { token })
        .then(response => {
          return response.data.status === 'success';
        })
        .catch(() => false);
    }
    return Promise.resolve(false);
  },
  getUserRole() {
    const token = localStorage.getItem('token');
    if (token) {
      return axios.post('/etherscan/verify.php', { token })
        .then(response => {
          if (response.data.status === 'success') {
            return response.data.data.role;
          } else {
            return null;
          }
        })
        .catch(() => null);
    }
    return Promise.resolve(null);
  }
};

export default AuthService;
