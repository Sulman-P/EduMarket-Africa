const params = new URLSearchParams(window.location.search)

const file = params.get("file")

if(file){

document.getElementById("pdfViewer").src = file

}
