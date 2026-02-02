
import { Outlet } from 'react-router'

export const LayoutAccount = () => {
    return (
        <div className='bg-main'>
            <main className="">
                <Outlet />
            </main>
        </div>
    )
}
