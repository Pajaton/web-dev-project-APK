<template>
  <!-- Login HTML template -->
  <div>
    <b-container fluid>
      <h1 class="display-5 fw-bold">Welcome to APK</h1>
    </b-container>
    <BForm>
      <BFormFloatingLabel
        label="Email address"
        label-for="floatingEmail"
        class="my-2"
      >
        <BFormInput
          id="floatingEmail"
          v-model="email"
          type="email"
          placeholder="Email address"
        />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="Password"
        label-for="floatingPassword"
        class="my-2"
      >
        <BFormInput
          id="floatingPassword"
          v-model="password"
          type="password"
          placeholder="Password"
        />
      </BFormFloatingLabel>
      <b-button block variant="danger" @click="resetFields()">Reset</b-button>
      <b-button block type="button" variant="login" @click="userVerification()">Login</b-button>

    </BForm>
    <b-button block  to="/register">Register</b-button>
    <BToast
      v-model="show"
      variant="info"
      solid
    >
      <template #title> Unable to login </template>
      Email or password is wrong.
    </BToast>
  </div>
</template>

<script>
// Login view behavior

import { drinkApi } from '@/Api'

export default {
  name: 'login',
  data() {
    return {
      message: 'none',
      email: '',
      password: '',
      verifiedUser: false,
      show: false
    }
  },
  methods: {
    async userVerification() {
      const response = await drinkApi('/users/')
      const data = response.data
      data.users.forEach(user => {
        if (user.email === this.email) {
          this.$router.push({ path: '/home' })
          this.verifiedUser = true
        }
      })
      if (this.verifiedUser === false) {
        this.show = true
      }
    },
    resetFields() {
      this.email = ''
      this.password = ''
      this.show = false
    }
  }
}
</script>

<style>
    /* Login CSS styles */
  .btn-login {
    color: green !important;
    font-family: Impact,'Arial Narrow Bold', sans-serif !important;
    background: yellow !important;
    border-color: green !important;
    border-width: 5px !important;
    border-style: solid;
  }
</style>
