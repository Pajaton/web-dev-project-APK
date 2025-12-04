<template>
    <!-- User Profile HTML template -->
    <div>
      <h1>COMMUNITY HOMEPAGE</h1>
      <h3 class="users-info-style">List of users: </h3>
      <div class="users-info-style" style="padding-left: 1rem;">
        <li style="list-style: none;" v-for="user in users" :key="user._id">
          <router-link
            :to="{ name: 'userProfile', params: { id: user._id } }">
            {{ user.userName }}
          </router-link>
        </li>
      </div>
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
  // Methods run when entering this webpage
  created() {
    this.users = this.getUsers()
  }
}
</script>

<style>
  .users-info-style {
    text-align: left;
  }
</style>
