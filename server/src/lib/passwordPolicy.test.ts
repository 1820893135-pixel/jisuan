import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getPasswordConfirmationError,
  getPasswordValidationErrors,
  isPasswordStrongEnough,
} from './passwordPolicy.js'

test('accepts passwords that satisfy length and complexity requirements', () => {
  assert.equal(isPasswordStrongEnough('Heritage!2026'), true)
  assert.deepEqual(getPasswordValidationErrors('Heritage!2026'), [])
})

test('rejects passwords that are shorter than 12 characters', () => {
  assert.deepEqual(getPasswordValidationErrors('Guide!2026'), ['密码长度需为 12-72 位'])
})

test('rejects passwords missing required character groups', () => {
  assert.deepEqual(getPasswordValidationErrors('heritageguide2026'), [
    '密码需同时包含大写字母、小写字母、数字和特殊字符',
  ])
})

test('rejects passwords that contain whitespace', () => {
  assert.deepEqual(getPasswordValidationErrors('Heritage 2026!'), ['密码不能包含空格'])
})

test('rejects mismatched password confirmation', () => {
  assert.equal(getPasswordConfirmationError('Heritage!2026', 'Heritage!2027'), '两次输入的密码不一致')
  assert.equal(getPasswordConfirmationError('Heritage!2026', 'Heritage!2026'), null)
})
