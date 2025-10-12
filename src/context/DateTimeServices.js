export const conversiDateTimeIDN = (currentDate) => {
    var hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    var bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    var dateDataIDN = new Date(currentDate);
    var tanggal = dateDataIDN.getDate();
    var xhari = dateDataIDN.getDay();
    var xbulan = dateDataIDN.getMonth();
    var xtahun = dateDataIDN.getYear();
  
    var hari = hari[xhari];
    var bulan = bulan[xbulan];
    var tahun = xtahun < 1000 ? xtahun + 1900 : xtahun;
  
    var tglIDN = hari + ", " + tanggal + " " + bulan + " " + tahun;
    return tglIDN;
  };


  export const formatDateNormal = (dateString) => {
    const months = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04',
        May: '05', Jun: '06', Jul: '07', Aug: '08',
        Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };

    // Pecah string input menjadi bagian-bagian
    let [day, month, year] = dateString.split('-');

    // Pastikan `day` tetap dalam format dua digit (misalnya, '01', '02')
    day = day.padStart(2, '0');

    // Konversi nama bulan menjadi angka menggunakan objek `months`
    const monthNumber = months[month];

    // Kembalikan dalam format DD-MM-YYYY
    return `${day}-${monthNumber}-${year}`;
};



  export const getTimeOnly = (currentDate) => {
    let d = new Date(currentDate);
    let hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
    let minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes();
    let seconds = d.getSeconds() <= 9 ? `0${d.getSeconds()}` : d.getSeconds();
  
    var tglIDN = hours + ":" + minutes 
    return tglIDN;
  };


  export const getDayOnlyIDN = (currentDate) => {
    var hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    var bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    var dateDataIDN = new Date(currentDate);
    var tanggal = dateDataIDN.getDate();
    var xhari = dateDataIDN.getDay();
    var xbulan = dateDataIDN.getMonth();
    var xtahun = dateDataIDN.getYear();
  
    var hari = hari[xhari];
    var bulan = bulan[xbulan];
    var tahun = xtahun < 1000 ? xtahun + 1900 : xtahun;
  
    var tglIDN = hari 
    return tglIDN;
  };


  export const getDate = (currentDate) => {
    var hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    var bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dateDataIDN = new Date(currentDate);
    var tanggal = dateDataIDN.getDate();
    var xhari = dateDataIDN.getDay();
    var xbulan = dateDataIDN.getMonth();
    var xtahun = dateDataIDN.getYear();
  
    var hari = hari[xhari];
    var bulan = bulan[xbulan];
    var tahun = xtahun < 1000 ? xtahun + 1900 : xtahun;
  
    var tglIDN = tanggal + "-" + bulan + "-" + tahun 
    return tglIDN;
  };



  export const formatRupiah = (angka) => {

    var number_string = angka.toString(),
    split   		= number_string.split(','),
    sisa     		= split[0].length % 3,
    rupiah     		= split[0].substr(0, sisa),
    ribuan     		= split[0].substr(sisa).match(/\d{3}/gi);
   
    // tambahkan titik jika yang di input sudah menjadi angka ribuan
    if(ribuan){
      separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }
   
    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    var prefix =  'Rp. ' + rupiah;
    return prefix
  }