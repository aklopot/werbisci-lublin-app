export interface Address {
  id: number
  first_name: string
  last_name: string
  street: string
  apartment_no: string | null
  city: string
  postal_code: string
  description: string | null
  label_marked: boolean
}

export interface AddressCreateInput {
  first_name: string
  last_name: string
  street: string
  apartment_no?: string | null
  city: string
  postal_code: string
  description?: string | null
}

export interface AddressUpdateInput {
  first_name?: string
  last_name?: string
  street?: string
  apartment_no?: string | null
  city?: string
  postal_code?: string
  description?: string | null
  label_marked?: boolean
}

export interface AddressSearchQuery {
  q?: string
  label_marked?: boolean
  limit?: number
  offset?: number
  sort_field?: string
  sort_direction?: string
}


