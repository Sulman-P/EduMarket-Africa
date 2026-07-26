import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://biumroifsbjbkbbehspb.supabase.co'
const supabaseKey = 'sb_publishable_rOO6y17Kc48f-wb6vcF26Q_xtbT3oCL'
const supabase = createClient(supabaseUrl, supabaseKey)

// Example: Protect admin page
async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        window.location.href = "index.html"
    }
}

checkAdmin()
