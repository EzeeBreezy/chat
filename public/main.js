let nickname = '', password = ''

//! do i need to use FormData
loginForm.onsubmit = event => {
    event.preventDefault()
    if (nicknameInp.value !== '' && passwordInp.value !== '') {
        nickname = loginForm.nickname.value
        loginForm.nickname.value = ''
        password = loginForm.password.value
        loginForm.password.value = ''
    }
    // else 


}