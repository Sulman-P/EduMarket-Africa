const supabaseUrl = "https://ywywxtzkoevrlekzksjb.supabase.co"
const supabaseKey = "sb_publishable_rOO6y17Kc48f-wb6vcF26Q_xtbT3oCL"

const supabaseClient = supabase.createClient(
supabaseUrl,
supabaseKey
)
async function createExam(){

const title = document.getElementById("examTitle").value
const subject = document.getElementById("examSubject").value
const time = document.getElementById("examTime").value
const description = document.getElementById("examDescription").value

const { data, error } = await supabaseClient
.from("exams")
.insert([
{
title: title,
subject: subject,
time_limit: time,
description: description,
exam_type: "online"
}
])

if(error){

alert(error.message)

}else{

alert("Exam Created")

loadExams()

}

}
async function addQuestion(){

const examId = document.getElementById("examId").value

const question = document.getElementById("questionText").value

const a = document.getElementById("optionA").value
const b = document.getElementById("optionB").value
const c = document.getElementById("optionC").value
const d = document.getElementById("optionD").value

const correct = document.getElementById("correctAnswer").value

const { error } = await supabaseClient
.from("questions")
.insert([
{
exam_id: examId,
question: question,
option_a: a,
option_b: b,
option_c: c,
option_d: d,
correct: correct
}
])

if(error){

alert(error.message)

}else{

alert("Question Added")

}

}
async function loadExams(){

let { data } = await supabaseClient
.from("exams")
.select("*")

let html = ""

data.forEach(exam => {

html += `
<div class="exam-card">

<h3>${exam.title}</h3>

<p>${exam.subject}</p>

<p>Time: ${exam.time_limit} min</p>

<p>ID: ${exam.id}</p>

</div>
`

})

document.getElementById("examList").innerHTML = html

}

loadExams()
