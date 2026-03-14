export default function Home() {
  return (
    <main style={{padding:"40px", fontFamily:"Arial"}}>
      <h1>Welcome</h1>

      <p>This is the public homepage.</p>

      <p>Visitors can browse this page without logging in.</p>

      <button style={{
        padding:"10px 20px",
        marginTop:"20px",
        cursor:"pointer"
      }}>
        Login with Discord
      </button>
    </main>
  )
}