<template>
    <!-- User Profile HTML template -->
    <div>
      <ul class="users-list">
        <p v-for="user in users" :key="user._id">
            {{ user.userName }}
        </p>
      </ul>
    </div>
</template>

<script>

import { drinkApi } from '@/Api'

export default {
  name: 'userProfile',
  data() {
    return {
      message: 'none',
      users: []
    }
  },
  methods: {
    getUsers() {
      drinkApi.get('/users/')
        .then(response => {
          this.users = response.data.users
        })
        .catch(error => {
          this.message = error
        })
    }
  },
  created() {
    this.users = this.getUsers()
  }
}
</script>

<style>
    /* User Profile CSS styles */
</style>
