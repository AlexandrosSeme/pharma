export type Product = {
  id: string
  sku: string
  name: string
  category: string
  form: string
  packSize: number
  price: number
  stock: number
  prescriptionRequired: boolean
  active: boolean
}

export type NewProduct = Omit<Product, 'id'>
export type ProductUpdate = Partial<NewProduct>
