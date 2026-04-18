/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAuthSubmitValidationMessage,
  getPasswordChangeValidationMessage,
  getPasswordVisibilityToggleMeta,
  getProfileUsernameValidationMessage,
  getRegisterPasswordMatchError,
  getRegisterPasswordValidationErrors,
  getRegisterUsernameHint,
} from './authValidation'

test('register password validation accepts a strong password', () => {
  assert.deepEqual(getRegisterPasswordValidationErrors('Heritage!2026'), [])
})

test('register password validation returns the first unmet rule', () => {
  assert.deepEqual(getRegisterPasswordValidationErrors('heritage2026'), [
    '密码需同时包含大写字母、小写字母、数字和特殊字符',
  ])
})

test('submit validation blocks weak passwords only in register mode', () => {
  assert.equal(
    getAuthSubmitValidationMessage('register', {
      captchaCode: 'ABCD',
      captchaId: 'captcha-id',
      confirmPassword: 'heritage2026',
      password: 'heritage2026',
      username: 'hangzhou-guide',
    }),
    '密码需同时包含大写字母、小写字母、数字和特殊字符',
  )

  assert.equal(
    getAuthSubmitValidationMessage('login', {
      captchaCode: 'ABCD',
      captchaId: 'captcha-id',
      confirmPassword: '',
      password: 'weakpass',
      username: 'hangzhou-guide',
    }),
    '',
  )
})

test('register validation rejects mismatched confirmation passwords', () => {
  assert.equal(getRegisterPasswordMatchError('Heritage!2026', 'Heritage!2027'), '两次输入的密码不一致')

  assert.equal(
    getAuthSubmitValidationMessage('register', {
      captchaCode: 'ABCD',
      captchaId: 'captcha-id',
      confirmPassword: 'Heritage!2027',
      password: 'Heritage!2026',
      username: 'hangzhou-guide',
    }),
    '两次输入的密码不一致',
  )
})

test('username hint suggests alternatives when the username is already taken', () => {
  assert.equal(
    getRegisterUsernameHint('hangzhou-guide', {
      available: false,
      suggestions: ['hangzhou-guide_01', 'hangzhou-guide_trip', 'hangzhou-guide2026'],
    }),
    '该用户名已被使用，可以试试：hangzhou-guide_01、hangzhou-guide_trip、hangzhou-guide2026',
  )
})

test('password visibility toggle metadata switches label and input type', () => {
  assert.deepEqual(getPasswordVisibilityToggleMeta(false), {
    inputType: 'password',
    label: '显示密码',
  })

  assert.deepEqual(getPasswordVisibilityToggleMeta(true), {
    inputType: 'text',
    label: '隐藏密码',
  })
})

test('profile username validation blocks unchanged usernames', () => {
  assert.equal(getProfileUsernameValidationMessage('traveler', 'traveler'), '用户名还没有发生变化')
  assert.equal(getProfileUsernameValidationMessage('traveler', '  '), '请输入新的用户名')
  assert.equal(getProfileUsernameValidationMessage('traveler', 'heritage-guide'), '')
})

test('password change validation requires current password and a stronger new password', () => {
  assert.equal(
    getPasswordChangeValidationMessage({
      confirmPassword: 'NewHeritage!2027',
      currentPassword: '',
      newPassword: 'NewHeritage!2027',
    }),
    '请输入当前密码后再继续',
  )

  assert.equal(
    getPasswordChangeValidationMessage({
      confirmPassword: 'heritage2027',
      currentPassword: 'Heritage!2026',
      newPassword: 'heritage2027',
    }),
    '密码需同时包含大写字母、小写字母、数字和特殊字符',
  )

  assert.equal(
    getPasswordChangeValidationMessage({
      confirmPassword: 'NewHeritage!2028',
      currentPassword: 'Heritage!2026',
      newPassword: 'NewHeritage!2027',
    }),
    '两次输入的密码不一致',
  )

  assert.equal(
    getPasswordChangeValidationMessage({
      confirmPassword: 'NewHeritage!2027',
      currentPassword: 'Heritage!2026',
      newPassword: 'NewHeritage!2027',
    }),
    '',
  )
})
