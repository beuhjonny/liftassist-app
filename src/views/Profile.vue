<template>
  <div class="profile-view">
    <h1>Profile</h1>
    <div v-if="user" class="user-details">
      <img v-if="user.photoURL" :src="user.photoURL" alt="User Photo" class="user-photo" />
      <p><strong>Name:</strong> {{ user.displayName || 'N/A' }}</p>
      <p><strong>Email:</strong> {{ user.email || 'N/A' }}</p>
      <p><strong>UID:</strong> {{ user.uid }}</p>
      <button @click="handleLogout" class="logout-button">Logout</button>
    </div>
    <div v-else>
      <p>Loading user information or not logged in...</p>
    </div>
  </div>
</template>  <script setup lang="ts">
import { useRouter } from 'vue-router';
import useAuth from '../composables/useAuth'; // Adjust path if needed

const { user, logout } = useAuth();
const router = useRouter();

const handleLogout = async () => {
  try {
    await logout();
    router.push('/');
  } catch (error) {
    console.error('Error during profile logout:', error);
  }
};
</script>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.user-details {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  text-align: left;
  min-width: 300px;
}

.user-details p {
  margin: 10px 0;
}

.user-photo {
  display: block;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 20px auto;
  border: 2px solid #ddd;
}

.logout-button {
  display: block;
  margin: 20px auto 0 auto;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #DB4437;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-button:hover {
  background-color: #c23327;
}
</style>