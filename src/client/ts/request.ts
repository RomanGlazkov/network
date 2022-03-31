export async function request(url: string, method = 'GET', data = null) {
  try {
    const headers = {};
    let body;

    if (data) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    return await response.json();
  } catch (err) {
    console.log(err.message);
  }
}

export function showError(message: string) {
  const error = document.querySelector('.error');

  error.textContent = message;
  error.classList.remove('hidden');

  setTimeout(() => {
    error.classList.add('hidden');
  }, 3000);
}
