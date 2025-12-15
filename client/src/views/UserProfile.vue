<template>
  <div>
    <div v-if="user">
      <b-img :src="user.profilePicture" fluid alt="Profile Picture" style="max-width: 400px; max-height: 400px; margin-left: 0px; display:block;"></b-img>
      <b-card style="max-width: 400px" horizontal header="User Info">
        <b-list-group >
          <b-list-group-item flush variant="primary">Username: {{user.userName}}</b-list-group-item>
          <b-list-group-item flush variant="primary">Email: {{user.email}}</b-list-group-item>
          <b-list-group-item flush variant="primary">Adress: {{user.street}} {{ user.streetNumber}}</b-list-group-item>
          <b-list-group-item flush variant="primary">Postal code: {{user.postalCode}}</b-list-group-item>
          <b-list-group-item flush variant="primary">City: {{user.city}}</b-list-group-item>
          <b-list-group-item flush variant="primary">Following: {{user.follows.length}} people</b-list-group-item>
          <b-list-group-item flush variant="primary">Number of review written: {{user.reviewsWritten.length}}</b-list-group-item>
          <b-list-group-item flush variant="primary">lcoholic intake: {{user.alcoholConsumed.length}}</b-list-group-item>
          <b-list-group-item flush variant="primary">How many drinks tried: {{user.triedDrinks.length}}</b-list-group-item>
          <b-list-group-item flush variant="primary" v-for="followedUser in userFollowingList" :key="followedUser.email">{{ user.userName }} follows: {{ followedUser.userName }}</b-list-group-item>
        </b-list-group>
      </b-card>
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
  .list-group-item {
    text-align: left;
}
</style>
