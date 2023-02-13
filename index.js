
import {createApp} from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const apiUrl = "https://vue3-course-api.hexschool.io/v2";
const path = "rena";

Object.keys(VeeValidateRules).forEach(rule => {
    if (rule !== 'default') {
        VeeValidate.defineRule(rule, VeeValidateRules[rule]);
    }
});

// 讀取外部的資源
VeeValidateI18n.loadLocaleFromURL('./zh_TW.json');

// Activate the locale
VeeValidate.configure({
    generateMessage: VeeValidateI18n.localize('zh_TW'),
    validateOnInput: true, // 調整為：輸入文字時，就立即進行驗證
});


// 2. 加入產品 查看更多的 modal 元件
// 開啟 modal 的暫存產品資料 + 版型template id + 註冊 modal 元件
const productModal = {
    // 3. 取得id, 當id變動(watch)時，取得遠端資料後，呈現 modal(openModal(id))。
    props:['id',"addToCart","openModal"],
    data(){
        return{
            modal:{}, //modal 實體化賦予結果
            tempProduct:{},
            qty:1
        }
    },
    template:`#userProductModal`,  //x-template 帶id   
    //三種用法 : 樣板字面值、x-template、vite

    watch:{  // 監測 id 是否變動
        id(){
            //console.log('productModal:', this.id);
            if(this.id){
                axios.get(`${apiUrl}/api/${path}/product/${this.id}`)
                .then(res=>{
                    this.tempProduct = res.data.product;
                    //console.log(this.tempProduct);
                    this.modal.show();
                })
            }
        }
    },
    methods:{
        hide(){
            this.modal.hide();
        }
    },
    mounted(){
        //console.log(this);
        this.modal = new bootstrap.Modal(this.$refs.modal);

        //監聽 DOM 當model 關閉時，要做的事情
        this.$refs.modal.addEventListener('hidden.bs.modal',e=>{
           // this.id='';  //props 不能改值
           this.openModal(''); //更新id
        })
        //this.modal.show();
    }
}

// 1. 取得產品列表 : 
// products 資料陣列 + methods getProducts() 抓api + mounted this.getProducts 執行
const app = createApp({
    data(){
        return {
            products:[],
            productId:'',
            cart:{},
            loadingItem:'', //存id
            // isLoading:true,
            user:{
            }
        }
    },
    methods:{
        getProducts(){
            axios.get(`${apiUrl}/api/${path}/products/all`)
            .then(res=>{
                this.products = res.data.products;
                //console.log('產品列表:',res.data.products);
            })
        },
        openModal(id){
            this.productId = id;
            //console.log(id);
        },
        addToCart(product_id,qty=1){
            const data = {
                product_id,  //縮寫 : 同名不寫第二次
                qty
            }
            this.loadingItem = product_id;
            axios.post(`${apiUrl}/api/${path}/cart`, { data } )
            .then(res=>{
                console.log("加入購物車:" , res.data);
                this.$refs.productModal.hide();  //使用 ref 外層傳入內層執行
                this.loadingItem = '';
                this.getCarts();
            })
        },
        getCarts(){
            axios.get(`${apiUrl}/api/${path}/cart`)
            .then(res=>{
                //console.log("購物車:", res.data);
                this.cart = res.data.data;
            })
        },
        updateCartItem(item){  //購物車內有兩個id :  購物車id  & 產品id 
            const data = {
                product_id:item.product.id,  //產品id
                qty:item.qty,
            }
            this.loadingItem = item.id;

            //console.log("更新項目: ",data, item.id);
            axios.put(`${apiUrl}/api/${path}/cart/${item.id}`,{data}) //要帶購物車id
            .then(res=>{
                //console.log("購物車:", res.data);
                this.cart = res.data.data;
                this.loadingItem = '';
                this.getCarts();
            })
        },
        deleteItem(item){
            this.loadingItem = item.id;

            axios.delete(`${apiUrl}/api/${path}/cart/${item.id}`) 
            .then(res=>{
                //console.log("刪除購物車:", res.data);
                this.loadingItem = '';
                this.getCarts();
            })
        },
        clearCart(){
            axios.delete(`${apiUrl}/api/${path}/carts`) 
            .then(res=>{
                //console.log("刪除購物車:", res.data);
                this.getCarts();
            })
        },
        onSubmit(){
            console.log('submit')
        }
    },
    components:{  //區域註冊
        productModal,
    },
    mounted(){
        let loader = this.$loading.show();
        if(this.products){
            loader.hide()
        }
        // setTimeout(() => {
        //     loader.hide()
        // }, 3000)
        this.getProducts();
        this.getCarts();
        
    }
    
})

// app.component('loading',VueLoading.component);
//console.log(VueLoading);
app.use(VueLoading.LoadingPlugin,{
    color: '#DEB887',
    loader: 'dots', //spinner/dots/bars
    width: 50,
    height: 50,
    backgroundColor: '#ffffff',
    isFullPage: true,
    opacity: 0.8
});


app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);
console.log(VeeValidate);
//app.component("productModal",productModal);  //全域註冊
app.mount("#app");