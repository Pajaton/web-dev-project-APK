<template>
  <div>
    <div v-if="user">
      <b-img :src="user.profilePicture" fluid alt="Profile Picture" style="max-width: 400px; margin-left: 0px; display:block;"></b-img>
      <ul class="user-info-list">
        <li>Username: {{user.userName}}</li>
        <li>Email: {{user.email}}</li>
        <li>Adress: {{user.street}} {{ user.streetNumber}}</li>
        <li>Postal code: {{user.postalCode}}</li>
        <li>City: {{user.city}}</li>
        <li>Following: {{user.follows.length}} people</li>
        <li>Number of review written: {{user.reviewsWritten.length}}</li>
        <li>Alcoholic intake: {{user.alcoholConsumed.length}}</li>
        <li>How many drinks tried: {{user.triedDrinks.length}}</li>
        <li v-for="followedUser in userFollowingList" :key="followedUser.email">{{ user.userName }} follows: {{ followedUser.userName }}</li>
      </ul>
      <b-button block v-if="id === mockUserId" type="button" variant="login" @click="goToEdit()">Edit Profile</b-button>
    </div>
  </div>
</template>

<script>
import { drinkApi } from '@/Api'

export default {
  name: 'users',
  data() {
    return {
      user: null,
      userFollowingList: [],
      mockUserId: '693951b9ff9d517c50d72ff1',
      show: false
    }
  },
  props: {
    id: String
  },
  methods: {
    getUserInfo() {
      drinkApi.get('/users/' + this.id)
        .then(response => {
          this.user = response.data
          this.getUserFollowingList()
        })
        .catch(error => {
          this.message = error
        })
    },
    getUserFollowingList() {
      drinkApi.get(this.user._links.follows)
        .then(response => {
          this.userFollowingList = response.data.follows
        })
        .catch(error => {
          this.message = error
        })
    },
    goToEdit() {
      this.$router.push({ path: '/users/' + this.mockUserId + '/edit' })
    }
  },
  created() {
    this.getUserInfo()
  }
}
</script>

<style>
  .user-info-list {
    text-align: left;
}
</style>
