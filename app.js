document.addEventListener('DOMContentLoaded', function() {
  // Inisialisasi EmailJS
  emailjs.init("YOUR_EMAILJS_USER_ID"); // Ganti dengan user ID EmailJS Anda
  
  // Update status
  document.getElementById('auth-status').textContent = "Siap mengirim surat";
  
  // Load pending letters dari local storage
  loadPendingLetters();
  
  // Event listener untuk tombol kirim
  document.getElementById('send-btn').addEventListener('click', sendLetter);
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('delivery-date').setAttribute('min', today);
  
  // Cek apakah ada surat yang perlu dikirim (untuk simulasi pengiriman terjadwal)
  checkScheduledLetters();
  
  // Set interval untuk mengecek surat terjadwal setiap menit
  setInterval(checkScheduledLetters, 60000);
});

// Fungsi untuk mengirim surat
function sendLetter() {
  const recipientEmail = document.getElementById('recipient-email').value;
  const letterTitle = document.getElementById('letter-title').value;
  const senderName = document.getElementById('sender-name').value;
  const content = document.getElementById('content').value;
  const deliveryDate = document.getElementById('delivery-date').value;
  const deliveryTime = document.getElementById('delivery-time').value;
  
  // Validasi input
  if (!recipientEmail || !letterTitle || !senderName || !content || !deliveryDate || !deliveryTime) {
    showModal("Error", "Harap isi semua field!");
    return;
  }
  
  // Validasi tanggal (tidak boleh di masa lalu)
  const selectedDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
  const now = new Date();
  if (selectedDateTime <= now) {
    showModal("Error", "Tanggal dan waktu pengiriman harus di masa depan!");
    return;
  }
  
  // Tampilkan animasi pengiriman
  document.getElementById('send-animation-overlay').style.display = 'flex';
  
  // Buat ID unik untuk surat
  const letterId = Date.now().toString();
  
  // Buat objek surat
  const letter = {
    id: letterId,
    recipientEmail,
    letterTitle,
    senderName,
    content,
    deliveryDate,
    deliveryTime,
    deliveryTimestamp: selectedDateTime.getTime(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  // Simpan ke local storage
  saveLetterToLocalStorage(letter);
  
  // Reset form
  document.getElementById('recipient-email').value = '';
  document.getElementById('letter-title').value = '';
  document.getElementById('sender-name').value = '';
  document.getElementById('content').value = '';
  document.getElementById('delivery-date').value = '';
  document.getElementById('delivery-time').value = '00:00';
  
  // Sembunyikan animasi
  document.getElementById('send-animation-overlay').style.display = 'none';
  
  // Tampilkan pesan sukses
  showModal("Sukses", "Surat Anda berhasil dikunci dan akan dikirim pada waktu yang ditentukan!");
  
  // Perbarui daftar surat pending
  loadPendingLetters();
}

// Fungsi untuk mengecek surat terjadwal
function checkScheduledLetters() {
  const letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  const now = new Date().getTime();
  
  letters.forEach(letter => {
    if (letter.status === 'pending' && letter.deliveryTimestamp <= now) {
      // Kirim email
      sendScheduledEmail(letter);
    }
  });
}

// Fungsi untuk mengirim email terjadwal
function sendScheduledEmail(letter) {
  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
    to_email: letter.recipientEmail,
    from_name: letter.senderName,
    subject: letter.letterTitle,
    message: letter.content,
    delivery_date: letter.deliveryDate,
    delivery_time: letter.deliveryTime
  })
  .then(function(response) {
    console.log("Email terjadwal berhasil dikirim!", response.status, response.text);
    
    // Update status surat menjadi 'sent'
    updateLetterStatus(letter.id, 'sent');
    
    // Tampilkan notifikasi (opsional)
    if (document.visibilityState === 'visible') {
      showModal("Surat Terkirim", `Surat "${letter.letterTitle}" telah berhasil dikirim ke ${letter.recipientEmail}`);
    }
  }, function(error) {
    console.error("Gagal mengirim email terjadwal:", error);
    
    // Update status surat menjadi 'failed'
    updateLetterStatus(letter.id, 'failed');
  });
}

// Fungsi untuk update status surat
function updateLetterStatus(letterId, status) {
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  letters = letters.map(letter => {
    if (letter.id === letterId) {
      letter.status = status;
      letter.sentAt = new Date().toISOString();
    }
    return letter;
  });
  localStorage.setItem('futureLetters', JSON.stringify(letters));
  
  // Perbarui tampilan jika halaman sedang aktif
  if (document.visibilityState === 'visible') {
    loadPendingLetters();
  }
}

// Fungsi untuk menyimpan surat ke local storage
function saveLetterToLocalStorage(letter) {
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  letters.push(letter);
  localStorage.setItem('futureLetters', JSON.stringify(letters));
}

// Fungsi untuk menghapus surat dari local storage
function removeLetterFromLocalStorage(letterId) {
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  letters = letters.filter(letter => letter.id !== letterId);
  localStorage.setItem('futureLetters', JSON.stringify(letters));
}

// Fungsi untuk memuat daftar surat pending
function loadPendingLetters() {
  const letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  const letterList = document.getElementById('letter-list');
  const noLettersMessage = document.getElementById('no-letters-message');
  
  // Kosongkan daftar
  letterList.innerHTML = '';
  
  // Filter hanya surat yang masih pending
  const pendingLetters = letters.filter(letter => letter.status === 'pending');
  
  if (pendingLetters.length > 0) {
    pendingLetters.forEach(letter => {
      // Format tanggal dan waktu
      const deliveryDate = new Date(letter.deliveryTimestamp);
      const formattedDate = deliveryDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const formattedTime = deliveryDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Hitung sisa waktu
      const now = new Date();
      const timeLeft = deliveryDate - now;
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      // Buat elemen surat
      const letterItem = document.createElement('li');
      letterItem.className = 'letter-item';
      letterItem.innerHTML = `
        <div class="letter-header">
          <h3>${letter.letterTitle}</h3>
          <span class="letter-status">Pending</span>
        </div>
        <div class="letter-details">
          <p><strong>Penerima:</strong> ${letter.recipientEmail}</p>
          <p><strong>Pengirim:</strong> ${letter.senderName}</p>
          <p><strong>Dikirim pada:</strong> ${formattedDate} pukul ${formattedTime}</p>
          <p><strong>Sisa waktu:</strong> ${daysLeft} hari ${hoursLeft} jam</p>
        </div>
        <div class="letter-actions">
          <button class="btn small danger" onclick="deleteLetter('${letter.id}')">Hapus</button>
        </div>
      `;
      
      letterList.appendChild(letterItem);
    });
    
    // Sembunyikan pesan "belum ada surat"
    noLettersMessage.style.display = 'none';
  } else {
    // Tampilkan pesan "belum ada surat"
    noLettersMessage.style.display = 'block';
  }
}

// Fungsi untuk menghapus surat
function deleteLetter(letterId) {
  if (confirm("Apakah Anda yakin ingin menghapus surat ini?")) {
    removeLetterFromLocalStorage(letterId);
    showModal("Sukses", "Surat berhasil dihapus");
    loadPendingLetters();
  }
}

// Fungsi untuk menampilkan modal
function showModal(title, message) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').textContent = message;
  document.getElementById('custom-modal').style.display = 'flex';
}

// Fungsi untuk menyembunyikan modal
function hideModal() {
  document.getElementById('custom-modal').style.display = 'none';
}

// Export fungsi untuk penggunaan global
window.deleteLetter = deleteLetter;
window.hideModal = hideModal;