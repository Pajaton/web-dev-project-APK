<template>
  <!-- Register HTML template -->
  <div>
    <BFormGroup class="my-2">
    <h2>Register</h2>
    <BForm style="padding-left: 2rem;">
      <BFormFloatingLabel label="Email Address" label-for="floatingEmail">
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
      <BFormFloatingLabel label="User Name" label-for="floatingUserName">
      <BFormInput
        id="floatingUserName"
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
      <BFormFloatingLabel label="Password" label-for="floatingPassword">
        <BFormInput
          id="floatingPassword"
          v-model="password"
          type="password"
          placeholder="Password"
          :state="passwordState"
          aria-describedby="password-feedback"
        />
        <b-form-invalid-feedback id="password-feedback">
          Password needs to be at least 8 characters long, with uppercase, lowercase, numbers and special characters.
        </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Street" label-for="floatingStreet">
      <BFormInput
        id="floatingStreet"
        v-model="street"
        type="text"
        placeholder="street"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Street Number" label-for="floatingStreetNumber">
      <BFormInput
        id="floatingStreetNumber"
        v-model="streetNumber"
        type="text"
        placeholder="streetNumber"
        :state="numberState(streetNumber)"
        aria-describedby="streetNumber-feedback"
      />
      <b-form-invalid-feedback id="streetNumber-feedback">
        Only numbers are allowed
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="Postal Code" label-for="floatingPostalCode">
      <BFormInput
        id="floatingPostalCode"
        v-model="postalCode"
        type="text"
        placeholder="postalCode"
        :state="numberState(postalCode)"
        aria-describedby="postalCode-feedback"
      />
      <b-form-invalid-feedback id="postalCode-feedback">
        Only numbers are allowed
      </b-form-invalid-feedback>
      </BFormFloatingLabel>
      <BFormFloatingLabel label="City" label-for="floatingCity">
      <BFormInput
        id="floatingCity"
        v-model="city"
        type="text"
        placeholder="city"
      />
      </BFormFloatingLabel>
      <b-form-checkbox v-model="ageCheck" inline>I confirm that I am over 20 years old</b-form-checkbox>
      <BAlert :model-value="!!message" :variant="alertVariant" dismissible @dismissed="message=''"> {{ message }} </BAlert>
    </BForm>
    <b-button  variant="danger" block @click="resetFields()" class="my-2">Reset</b-button>
    <b-button variant="primary" block @click="registerUser()" :disabled="!validForm" class="my-2">Register</b-button>
    </BFormGroup>
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
    passwordState() {
      return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(this.password)
    },
    validForm() {
      return (this.emailState && this.nameState && this.passwordState && this.numberState(this.streetNumber) && this.numberState(this.postalCode) && this.ageCheck)
    }
  },
  data() {
    return {
      message: '',
      email: '',
      userName: '',
      password: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      userExist: false,
      ageCheck: false,
      alertVariant: 'info'
    }
  },
  methods: {
    showAlert(message, variant = 'info') {
      this.message = ''
      this.$nextTick(() => {
        this.message = message
        this.alertVariant = variant
      })
    },
    async registerUser() {
      await this.userVerification()
      if (this.userExist) {
        this.showAlert('This email already exist', 'warning')
        return
      }
      try {
        const response = await drinkApi.post('/users', {
          email: this.email,
          ProfilePicture: '/profilePictures/default_user.jpg',
          userName: this.userName,
          password: this.password,
          street: this.street,
          streetNumber: this.streetNumber,
          postalCode: this.postalCode,
          city: this.city,
          longitude: null,
          latitude: null
        })
        if (response.status === 201) {
          this.showAlert('Registration Successfull', 'success')
          setTimeout(() => {
            this.$router.push({ path: '/home' })
          }, 3000)
        } else {
          this.showAlert('Registration failed', 'danger')
        }
      } catch (error) {
        console.error(error)
        this.showAlert('Registration failed, server is unavailable', 'danger')
      }
    },
    resetFields() {
      this.email = ''
      this.userName = ''
      this.password = ''
      this.street = ''
      this.streetNumber = ''
      this.postalCode = ''
      this.city = ''
      this.ageCheck = false
    },
    async userVerification() {
      this.userExist = false
      try {
        const response = await drinkApi('/users/')
        const data = response.data
        data.users.forEach(user => {
          console.log('Checking user email:', user.email)

          if (user.email === this.email) {
            this.userExist = true
          }
        })
      } catch (error) {
        console.error('User verification failer:', error)
      }
    },
    numberState(number) {
      return /^\d*$/.test(number)
    }
  }
}
</script>

<style>
.my-2 {
      max-width: 500px;
    }
</style>
