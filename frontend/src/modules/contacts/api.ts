import { fetchJson } from '../../app/api'
import type { Address, AddressCreateInput, AddressSearchQuery, AddressUpdateInput } from './types'

export async function listAddresses(limit = 50, offset = 0): Promise<Address[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return fetchJson<Address[]>(`/api/addresses?${params.toString()}`)
}

export async function searchAddresses(query: AddressSearchQuery): Promise<Address[]> {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.first_name) params.set('first_name', query.first_name)
  if (query.last_name) params.set('last_name', query.last_name)
  if (query.city) params.set('city', query.city)
  if (query.street) params.set('street', query.street)
  if (typeof query.label_marked === 'boolean') params.set('label_marked', String(query.label_marked))
  params.set('limit', String(query.limit ?? 50))
  params.set('offset', String(query.offset ?? 0))
  return fetchJson<Address[]>(`/api/addresses/search?${params.toString()}`)
}

export async function createAddress(payload: AddressCreateInput): Promise<Address> {
  return fetchJson<Address>('/api/addresses', { method: 'POST', body: payload })
}

export async function updateAddress(id: number, payload: AddressUpdateInput): Promise<Address> {
  return fetchJson<Address>(`/api/addresses/${id}`, { method: 'PATCH', body: payload })
}

export async function deleteAddress(id: number): Promise<void> {
  return fetchJson<void>(`/api/addresses/${id}`, { method: 'DELETE' })
}


