import { http, HttpResponse } from 'msw'

export const COMPROVANTE_OK_URL = 'https://example.com/comprovante-valido.jpg'
export const COMPROVANTE_ALTERADO_URL = 'https://example.com/comprovante-alterado.jpg'

const fakeImageBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xFF\xFF\xFF\x00\x00\x00!\xF9\x04\x00\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;')

export const handlers = [
  http.get(COMPROVANTE_OK_URL, () =>
    new HttpResponse(fakeImageBuffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    })
  ),
  http.get(COMPROVANTE_ALTERADO_URL, () =>
    new HttpResponse(fakeImageBuffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    })
  ),
]
