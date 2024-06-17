<template>
  <div class="admin-page">
    <h1>Admin Panel</h1>
    <form @submit.prevent="createUser">
      <div>
        <label>Username:</label>
        <input v-model="username" type="text" required maxlength="50" />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required maxlength="50" />
      </div>
      <button type="submit">Create User</button>
    </form>
    <p v-if="statusMessage" class="status-message">{{ statusMessage }}</p> <!-- Status message -->
    <h2>Existing Users</h2>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.username }} ({{ user.role }})
        <button @click="deleteUser(user.id)" v-if="user.role !== 'admin'">Delete</button>
        <button @click="changeRole(user.id)" v-if="user.role !== 'admin'">Change Role</button>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminPage',
  data() {
    return {
      username: '',
      password: '',
      users: [],
      statusMessage: '' // Add this line to hold status messages
    };
  },
  created() {
    this.fetchUsers();
  },
  methods: {
    createUser() {
      axios.post('/etherscan/create_user.php', { username: this.username, password: this.password })
        .then(response => {
          if (response.data.status === 'success') {
            this.fetchUsers();
            this.username = '';
            this.password = '';
            this.statusMessage = 'User created successfully.'; // Success message
          } else {
            this.statusMessage = 'Failed to create user: ' + response.data.message; // Error message
          }
        })
        .catch(error => {
          console.error('Error creating user:', error);
          this.statusMessage = 'An error occurred while creating the user.'; // General error message
        });
    },
    fetchUsers() {
      axios.get('/etherscan/get_users.php')
        .then(response => {
          if (response.data.status === 'success') {
            this.users = response.data.users;
          } else {
            alert('Failed to fetch users');
          }
        })
        .catch(error => {
          console.error('Error fetching users:', error);
        });
    },
    deleteUser(userId) {
      axios.post('/etherscan/delete_user.php', { id: userId })
        .then(response => {
          if (response.data.status === 'success') {
            this.fetchUsers();
            this.statusMessage = 'User deleted successfully.';
          } else {
            this.statusMessage = 'Failed to delete user: ' + response.data.message;
          }
        })
        .catch(error => {
          console.error('Error deleting user:', error);
          this.statusMessage = 'An error occurred while deleting the user.';
        });
    },
    changeRole(userId) {
      axios.post('/etherscan/change_role.php', { id: userId })
        .then(response => {
          if (response.data.status === 'success') {
            this.fetchUsers();
            this.statusMessage = 'User role changed successfully.';
          } else {
            this.statusMessage = 'Failed to change user role: ' + response.data.message;
          }
        })
        .catch(error => {
          console.error('Error changing user role:', error);
          this.statusMessage = 'An error occurred while changing the user role.';
        });
    }
  }
};
</script>

<style>
.admin-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

form {
  margin-bottom: 20px;
}

ul {
  list-style: none;
  padding: 0;
}

.status-message {
  color: #e74c3c;  /* Soft reddish pink color for error */
  margin-top: 10px;
}
</style>
