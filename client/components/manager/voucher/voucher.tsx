import { useSession } from "next-auth/react";
import { FormEvent, FunctionComponent, useEffect, useState } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import useSWR from "swr";
import { ShopVoucher, Voucher } from "../../../types/voucher";
import { clientSideAPI } from "../../../utils/img";
import { fetcher } from "../../../utils/swr";
import styles from './voucher.module.scss'

interface VoucherProps { }

const Voucher: FunctionComponent<VoucherProps> = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([])
    const [shopVouchers, setShopVouchers] = useState<ShopVoucher[]>([])
    const [cursor, setCursor] = useState<number>(0)
    const [voucher, setVoucher] = useState({
        owner: '',
        shopVoucher: '',
        count: 1,
    })
    const [responseMsg, setResponseMsg] = useState({
        message: '',
        success: false,
        active: false
    })

    const { data } = useSWR<Voucher[]>(clientSideAPI + `/voucher/getAll?cursor=${cursor}`, fetcher)
    const { data: shopVoucherData } = useSWR<ShopVoucher[]>(clientSideAPI + `/voucher/getShopVouchers`, fetcher)
    const { data: session } = useSession()

    useEffect(() => {
        if (data) {
            setVouchers(data)
        }
    }, [data])

    useEffect(() => {
        if (shopVoucherData) {
            setShopVouchers(shopVoucherData)
        }
    }, [shopVoucherData])

    const onCreateVoucher = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault()

            if (voucher.owner === '' || voucher.shopVoucher === '') return;

            const res = await fetch(clientSideAPI + '/voucher/new/user', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(voucher)
            })
            const result = await res.json()

            if (result?.statusCode >= 400) throw new Error()

            setResponseMsg({
                active: true,
                message: 'Th??m voucher th??nh c??ng',
                success: true
            })

        } catch (error) {
            setResponseMsg({
                active: true,
                message: 'Th??m voucher th???t b???i',
                success: false
            })
        }
    }

    const pageChange = (step: 'prev' | 'next') => {
        if (step === 'prev' && cursor >= 10)
            setCursor(s => s - 10)

        if (step === 'next' && vouchers.length === 10)
            setCursor(s => s + 10)
    }

    const onDeleteVoucher = async (id: string, currentIndex: number) => {
        try {
            const res = await fetch(clientSideAPI + `/voucher/delete/${id}`, {
                method: 'DELETE'
            })
            const result = await res.json()

            if (result?.statusCode >= 400) throw new Error

            let items = [...vouchers]
            items.splice(currentIndex, 1)
            setVouchers(items)

            alert('???? g??? voucher !')

        } catch (error) {
            alert('X??a voucher th???t b???i!')
        }
    }

    const renderShopVouchers = () => {
        return shopVouchers.map((value, index) => {
            return (
                <option key={index} value={value._id}> {value.label} </option>
            )
        })
    }

    const renderVouchers = () => {
        return vouchers.map((value, index) => {
            return (
                <tr key={index}>
                    <td> {index + 1} </td>
                    <td> {value.owner} </td>
                    <td>
                        <div>{value.shopVoucher.label}</div>
                        <div className={styles.desc}>
                            ??p d???ng {value.shopVoucher.limit.min ? ` t??? ${Intl.NumberFormat().format(value.shopVoucher.limit.min)} VN??` : ''}
                            {value.shopVoucher.limit.max ? ` ?????n ${Intl.NumberFormat().format(value.shopVoucher.limit.max)} VN??` : ''}
                        </div>
                    </td>
                    <td> x{value.count} </td>
                    <td> {Intl.NumberFormat().format(value.shopVoucher.value)} {value.shopVoucher.value <= 100 ? "%" : "??"} </td>
                    <td>
                        <button onClick={() => onDeleteVoucher(value._id, index)}> Lo???i b??? </button>
                    </td>
                </tr>
            )
        })
    }

    return (
        <div className={styles.voucher}>
            <div className={styles['shop-vouchers']}>
                <div className={styles['vouchers-head']}>
                    <div className={styles['vouchers-head__title']}> T???t c??? voucher </div>
                    <div className={styles['vouchers-head__page']}>
                        <button onClick={() => pageChange('prev')}> <BiChevronLeft /> </button>
                        <button onClick={() => pageChange('next')}> <BiChevronRight /> </button>
                    </div>
                </div>
                <div className={styles['vouchers-table']}>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Kh??ch h??ng</th>
                                <th>T??n voucher</th>
                                <th>S??? l?????ng</th>
                                <th>Gi?? tr???</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderVouchers()}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className={styles['create-voucher']}>
                <div className={styles['create-voucher__head']}> Th??m voucher m???i </div>
                <form onSubmit={(e) => onCreateVoucher(e)} className={styles['voucher-form']}>
                    {responseMsg.active
                        && (
                            <h5
                                className={styles['response-msg']}
                                style={{ color: responseMsg.success ? '#06e763' : '#f30606' }}
                            > {responseMsg.message} </h5>
                        )
                    }
                    <div className={styles['form-item']}>
                        <div className={styles['form-item__label']}> Username * </div>
                        <input
                            type="text"
                            value={voucher.owner}
                            onChange={e => setVoucher(s => ({ ...s, owner: e.target.value }))}
                        />
                    </div>
                    <div className={styles['form-item']}>
                        <div className={styles['form-item__label']}> Voucher * </div>
                        <select
                            onChange={e => setVoucher(s => ({ ...s, shopVoucher: e.target.value }))}
                            value={voucher.shopVoucher}
                        >
                            <option value="" disabled> Ch???n voucher </option>
                            {renderShopVouchers()}
                        </select>
                    </div>
                    <div className={styles['form-item']}>
                        <div className={styles['form-item__label']}> S??? l?????ng voucher </div>
                        <input
                            type="number"
                            value={voucher.count}
                            onChange={e => setVoucher(s => ({
                                ...s,
                                count: (Number(e.target.value))
                            }))}
                        />
                    </div>
                    <div className={styles['form-item']}>
                        <button > T???o voucher m???i </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Voucher;