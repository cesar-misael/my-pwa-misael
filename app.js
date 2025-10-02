window.addEventListener('load', () => {
  // Mostrar Splash Screen por 2 segundos
  setTimeout(() => {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  }, 2000);

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registrado', reg))
      .catch(err => console.log('Error al registrar SW', err));
  }
});