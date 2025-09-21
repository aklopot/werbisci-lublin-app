export interface Address {
  id: number
  first_name: string
  last_name: string
  street: string
  apartment_no: string | null
  city: string
  postal_code: string
  label_marked: boolean
}

export interface AddressCreateInput {
  first_name: string
  last_name: string
  street: string
  apartment_no?: string | null
  city: string
  postal_code: string
}

export interface AddressUpdateInput {
  first_name?: string
  last_name?: string
  street?: string
  apartment_no?: string | null
  city?: string
  postal_code?: string
  label_marked?: boolean
}

export interface AddressSearchQuery {
  q?: string
  first_name?: string
  last_name?: string
  city?: string
  street?: string
  label_marked?: boolean
  limit?: number
  offset?: number
}


