// Component displayed when users access routes without proper authorization (403 error page).

import {useNavigate} from 'react-router-dom'
const Unauthorized = () => {
    const navigate = useNavigate()
    const goBack = () => navigate(-1)
    return (
        <section>
            <h1>Unauthorized</h1>
            <p>You are not authorized</p>
            <button onClick={goBack}>Go Back</button>
        </section>
    )
}
export default Unauthorized
