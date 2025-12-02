<template>
    <!-- APK HTML template -->
    <div>
        <form @submit.prevent="submitFilter">
            <p>Filter for drinks:</p>

            <ul class="filter-list">
                <li>
                    <label>
                        <input 
                            type="checkbox"
                            name="drink-filter" 
                            value="type"
                            v-model="selectedFilter"
                            >
                            Type of beverage
                        <form v-if="selectedFilter.includes('type')" class="sub-filter">
                            <label>
                                <input
                                    type="checkbox"
                                    name="drink"
                                    value="beer"
                                    v-model="selectedType"
                                    >
                                    Beer
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="drink"
                                    value="wine"
                                    v-model="selectedType"
                                    >
                                    Wine
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="drink"
                                    value="cider"
                                    v-model="selectedType"
                                    >
                                    Cider
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="drink"
                                    value="sprit"
                                    v-model="selectedType"
                                    >
                                    Sprit
                            </label>
                        </form>
                    </label>
                </li>
                <li>
                    <label>
                        <input 
                            type="checkbox"
                            name="drink-filter" 
                            value="percentage"
                            v-model="selectedFilter"
                            >
                            Alcohol percentage
                        <form v-if="selectedFilter.includes('percentage')" class="sub-filter">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                v-model="percentageText"
                            >
                            {{ percentageText }} %
                        </form>
                    </label>
                </li>
                <li>
                    <label>
                        <input 
                            type="checkbox"
                            name="drink-filter" 
                            value="price"
                            v-model="selectedFilter"
                            >
                            Price
                        <form v-if="selectedFilter.includes('price')" class="sub-filter">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                v-model="priceText"
                            >
                            {{ priceText }} kr
                        </form>
                    </label>
                </li>
                <li>
                    <label>
                        <input 
                            type="checkbox"
                            name="drink-filter" 
                            value="apk"
                            v-model="selectedFilter"
                            >
                            Alcohol per krona (krona per 1 ml of 100% alcohol)
                        <form v-if="selectedFilter.includes('apk')" class="sub-filter">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                v-model="apkText"
                            >
                            {{ apkText }} kr
                        </form>
                    </label>
                </li>
            </ul>
            <div>
                <button type="submit" class="filter-button">Apply filters</button>
            </div>
        </form>
    </div>
    <div>
        <form @submit.prevent="submitSort">
            <ul class="sort-list">
                <li>
                    <p>Sort drinks:</p>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="productNumber"
                        v-model="selectedSort"
                        >
                        Product number
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="name"
                        v-model="selectedSort"
                        >
                        Name
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="type"
                        v-model="selectedSort"
                        >
                        Type
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="container"
                        v-model="selectedSort"
                        >
                        Container
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="volume"
                        v-model="selectedSort"
                        >
                        Volume
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="percentage"
                        v-model="selectedSort"
                        >
                        Percentage
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="colour"
                        v-model="selectedSort"
                        >
                        Colour
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="price"
                        v-model="selectedSort"
                        >
                        Price
                </li>
                <li>
                    <input 
                        type="checkbox"
                        name="drink-sort" 
                        value="apk"
                        v-model="selectedSort"
                        >
                        APK
                </li>
            </ul>
            <div>
                <button type="submit" class="sort-button">Apply sort</button>
            </div>
        </form>
            <ul class="drinks-list">
                <li v-for="drink in drinks" :key="drink._id">
                    <a href="#" class="drink-link">
                        {{ drink.name }}
                    </a>
                </li>
            </ul>
    </div>
</template>


<script>

import { drinkApi } from '@/Api'

    // APK view behavior
export default {
    name: 'APK',
    data() {
        return {
            message: 'none',
            drinks: [],
            selectedFilter: [],
            selectedSort: [],
            selectedType: [],
            typeText: '',
            percentageText: '',
            priceText: '',
            apkText: '',
        }
    },
    methods: {
        prepareMessage(url) {

        },
        getMessage(filterUrl) {
        console.log(filterUrl)
            drinkApi.get('/drinks/' + filterUrl)
                .then(response => {
                console.log('1')
                    this.drinks = response.data.drinks
                
                })
                .catch(error => {
                    console.log('2')
                    this.message = error
                })       
        },

        buildQuery() {
            let query = ''

            if (this.selectedType.length) {
                this.selectedType.forEach((type, index) => {
                    let prefix 
                    if (index === 0) {
                        prefix = '?'
                    } else {
                        prefix = '&'
                    }
                    query += `${prefix}type=${this.capitalizeFirst(type)}`
                })
            }

            if (this.selectedFilter.includes('percentage') && this.percentageText) {
                if (query === '') {
                    query += '?'
                } else {
                    query += '&'
                }
                query += 'percentage=' + this.percentageText
            }

            if (this.selectedFilter.includes('price') && this.priceText) {
                if (query === '') {
                    query += '?'
                } else {
                    query += '&'
                }
                query += 'price=' + this.priceText
            }

            if (this.selectedFilter.includes('apk') && this.apkText) {
                if (query === '') {
                    query += '?'
                } else {
                    query += '&'
                }
                query += 'apk=' + this.apkText
            }

            if (this.selectedSort.length) {
                if (query === '') {
                    query += '?'
                } else {
                    query += '&'
                }
                query += 'sort=' + this.selectedSort[0]
            }

            return query
        },

        submitFilter() {
            const query = this.buildQuery()
            this.getMessage(query)
        }, 

        submitSort() {
            const query = this.buildQuery()
            this.getMessage(query)
        },

        capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
        },
    }
}
</script>


<style>
    .filter-list label {
        align-items: center;
        gap: 0.5rem;
    }
    .filter-list {
        list-style: none;
    }
    .filter-list li {
        text-align: left;
    }
    .drinks-list {
        margin-top: 1rem;
        padding-left: 2rem;
        list-style: none;
        text-align: left;
    }
    .sub-filter {
        margin-left: 2rem;
        margin-top: 0.25rem;
    }
    .sub-filter label {
        margin-right: 1rem;
    }
    .filter-button {
        margin-left: 2rem;
    }
    .sort-list {
        list-style: none;
    }
    .sort-list li {
        text-align: left;
    }
</style>