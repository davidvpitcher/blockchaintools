<template>
  <div id="app">
    <nav>
      <router-link to="/"><img src="./assets/logo.png" alt="Logo" class="logo"></router-link>
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/about">About</router-link></li>
        <li><router-link to="/contact">Contact</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/tool1">Spreadsheet-Tool</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/tool2">Tool 2</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/tool3">Tool 3</router-link></li>
        <li v-if="isAuthenticated && isAdmin"><router-link to="/admin">Admin Panel</router-link></li> <!-- Admin link -->
        <li v-if="!isAuthenticated"><router-link to="/login">Login</router-link></li>
        <li v-if="isAuthenticated" @click="logout"><a href="#">Logout</a></li>
      </ul>
    </nav>
    <main>
      <router-view @login-success="checkAuth"></router-view>
    </main>
  </div>
</template>

<script>
import AuthService from '@/services/AuthService';

export default {
  name: 'App',
  data() {
    return {
      isAuthenticated: false,
      isAdmin: false // Add isAdmin state
    };
  },
  created() {
    this.checkAuth();
  },
  methods: {
    checkAuth() {
      AuthService.isAuthenticated().then(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          AuthService.getUserRole().then(role => {
            this.isAdmin = (role === 'admin');
          });
        }
      });
    },
    logout() {
      AuthService.logout();
      this.isAuthenticated = false;
      this.isAdmin = false; // Reset isAdmin state on logout
      this.$router.push('/');
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin: 0;
}
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #35495e;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  box-sizing: border-box; /* Ensure padding and width are accounted correctly */
}
.logo {
  height: 40px;
}
nav ul {
  list-style: none;
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
}
nav ul li {
  display: inline;
}
nav ul li a {
  color: #fff;
  text-decoration: none;
}
main {
  margin-top: 4rem; /* Adjust as needed to avoid content being hidden behind the nav bar */
  padding-top: 1rem;
}
</style>
