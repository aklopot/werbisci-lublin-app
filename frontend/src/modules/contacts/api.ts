import { fetchJson } from '../../app/api'
import type { Address, AddressCreateInput, AddressSearchQuery, AddressUpdateInput } from './types'

export async function listAddresses(limit = 50, offset = 0, sortField = 'id', sortDirection = 'asc'): Promise<Address[]> {
  const params = new URLSearchParams({ 
    limit: String(limit), 
    offset: String(offset),
    sort_field: sortField,
    sort_direction: sortDirection
  })
  return fetchJson<Address[]>(`/api/addresses?${params.toString()}`)
}

export async function searchAddresses(query: AddressSearchQuery): Promise<Address[]> {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (typeof query.label_marked === 'boolean') params.set('label_marked', String(query.label_marked))
  params.set('limit', String(query.limit ?? 50))
  params.set('offset', String(query.offset ?? 0))
  params.set('sort_field', query.sort_field ?? 'id')
  params.set('sort_direction', query.sort_direction ?? 'asc')
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


