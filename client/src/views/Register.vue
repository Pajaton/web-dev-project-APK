<template>
  <!-- Register HTML template -->
  <div>
    <h2>Register</h2>
    <BForm style="padding-left: 2rem;">
      <BFormFloatingLabel label="Email Address" label-for="floatingEmail" class="my-2">
      <BFormInput
        id="floatingEmail"
        v-model="email"
        type="email"
        placeholder="Email address"
        :state="emailState"
        aria-describedby="email-feedback"
      />
      <b-form-invalid-feedback id="email-feedback">
        Enter a valid email
      </b-form-invalid-feedback>
    </BFormFloatingLabel>
      <BFormFloatingLabel label="User Name" label-for="floatingUserName" class="my-2">
      <BFormInput
        id="floatingName"
        v-model="userName"
        type="text"
        placeholder="UserName"
        :state="nameState"
        aria-describedby="userName-feedback"
      />
      <b-form-invalid-feedback id="userName-feedback">
        Enter at least 5 characters
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Street" label-for="floatingStreet" class="my-2">
      <BFormInput
        id="floatingStreet"
        v-model="street"
        type="text"
        placeholder="street"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Street Number" label-for="floatingStreetNumber" class="my-2">
      <BFormInput
        id="floatingStreetNumber"
        v-model="streetNumber"
        type="text"
        placeholder="streetNumber"
        :state="numberState(streetNumber)"
        aria-describedby="streetNumber-feedback"
      />
      <b-form-invalid-feedback id="streetNumber-feedback">
        Only numbers are alowed
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Postal Code" label-for="floatingpostalCode" class="my-2">
      <BFormInput
        id="floatingpostalCode"
        v-model="postalCode"
        type="text"
        placeholder="postalCode"
        :state="numberState(postalCode)"
        aria-describedby="postalCode-feedback"
      />
      <b-form-invalid-feedback id="postalCode-feedback">
        Only numbers are alowed
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="City" label-for="floatingcity" class="my-2">
      <BFormInput
        id="floatingcity"
        v-model="city"
        type="text"
        placeholder="city"
      />
      </BFormFloatingLabel>
      <b-form-checkbox v-model="ageCheck">I confirm that I am over 20 years old</b-form-checkbox>
      <b-button  variant="danger" block @click="resetFields()">Reset</b-button>
      <b-button variant="primary" block @click="modalShowConfirmation = true" :disabled="!validForm">Register</b-button>
      <b-modal v-model="modalShowConfirmation" title="Registration Confirmation" @ok="registerUser()">
        <p>Click ok to confirm your registration</p>
      </b-modal>
    </BForm>
  </div>
</template>

<script>
// Register view behavior

import { drinkApi } from '@/Api'

export default {
  name: 'Register',
  computed: {
    emailState() {
      return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)
    },
    nameState() {
      return this.userName.length > 4
    },
    validForm() {
      return (this.emailState && this.nameState && this.numberState(this.streetNumber) && this.numberState(this.postalCode) && this.ageCheck)
    }
  },
  data() {
    return {
      message: 'none',
      email: '',
      userName: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      userExist: false,
      ageCheck: false,
      modalShowConfirmation: false
    }
  },
  methods: {
    async registerUser() {
      this.userVerification()
      if (this.userExist === false) {
        drinkApi.post('/users', {
          email: this.email,
          ProfilePicture: '/profilePictures/default_user.jpg',
          userName: this.userName,
          street: this.street,
          streetNumber: this.streetNumber,
          postalCode: this.postalCode,
          city: this.city,
          longitude: null,
          latitude: null
        })
      }
      this.$router.push({ path: '/home' })
      console.log('User added: ' + this.userName + ' ' + ' Email: ' + this.email)
    },
    resetFields() {
      this.email = ''
      this.userName = ''
      this.street = ''
      this.streetNumber = ''
      this.postalCode = ''
      this.city = ''
    },
    async userVerification() {
      const response = await drinkApi('/users/')
      const data = response.data
      data.users.forEach(user => {
        if (user.email === this.email) {
          this.userExist = true
        }
      })
    },
    numberState(number) {
      return /^\d*$/.test(number)
    }
  }
}
</script>

<style>
    /* Find Systembolag CSS styles */
</style>
