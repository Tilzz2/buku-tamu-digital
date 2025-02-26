document.addEventListener("DOMContentLoaded", function () {
    fetch("daftar_kontak.json") // Pastikan file JSON ada di lokasi yang benar
        .then(response => {
            if (!response.ok) {
                throw new Error("Gagal memuat daftar_kontak.json");
            }
            return response.json();
        })
        .then(data => {
            console.log("Data kontak berhasil dimuat:", data); // Debugging
            let selectOrang = document.getElementById("orang");

            data.forEach(contact => {
                let option = document.createElement("option");
                option.value = contact.nomor;
                option.textContent = `${contact.nama}`;
                selectOrang.appendChild(option);
            });

            console.log("Dropdown berhasil diisi."); // Debugging
        })
        .catch(error => console.error("Terjadi kesalahan:", error));
});

function kirimWhatsApp() {
    let nama = document.getElementById("nama").value;
    let orang = document.getElementById("orang");
    let whatsapp = orang.value;
    let alasan = document.getElementById("alasan").value;
    let jam = document.getElementById("jam").value;

    if (!nama || !whatsapp || !alasan || !jam) {
        alert("Harap isi semua kolom!");
        return;
    }

    let pesan = `Halo, saya *${nama}* ingin bertemu dengan Anda.\n\nAlasan: *${alasan}*\nJam: *${jam}*`;
    let whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(pesan)}`;

    window.open(whatsappUrl, '_blank'); // Buka WhatsApp
}
