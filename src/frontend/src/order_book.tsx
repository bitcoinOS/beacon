import * as React from "react";
import { Order, OrderType } from "./types";
import { Principal } from "@dfinity/principal";
import { Button, PAYMENT_TOKEN_ID, orderId, token, tokenBase } from "./common";

export const OrderBook = ({
    tokenId,
    heartbeat,
    callback,
}: {
    tokenId: string;
    heartbeat: any;
    callback: () => void;
}) => {
    const [buyOrders, setBuyOrders] = React.useState<Order[]>([]);
    const [sellOrders, setSellOrders] = React.useState<Order[]>([]);
    const loadData = async () => {
        const [buyOrders, sellOrders] = await Promise.all([
            await window.api.orders(Principal.fromText(tokenId), OrderType.Buy),
            await window.api.orders(
                Principal.fromText(tokenId),
                OrderType.Sell,
            ),
        ]);
        setBuyOrders(buyOrders as unknown as any);
        setSellOrders(sellOrders as unknown as any);
    };

    React.useEffect(() => {
        loadData();
    }, [heartbeat]);

    const maxOrderSize = buyOrders
        .concat(sellOrders)
        .reduce((acc, order) => Math.max(acc, Number(order.amount)), 0);

    const filter = (order: Order) =>
        order.owner.toString() == window.principalId?.toString();
    const userOrders = {
        buy: buyOrders.filter(filter),
        sell: sellOrders.filter(filter),
    };

    const tokenData = window.tokenData[tokenId];
    const paymentTokenDataData = window.tokenData[PAYMENT_TOKEN_ID];

    const userOrdersList = (orders: Order[], type: OrderType) =>
        orders.map((order) => (
            <tr
                key={orderId(order)}
                className="row_container small_text vcentered"
            >
                <td
                    style={{
                        color: type == OrderType.Buy ? "green" : "red",
                    }}
                >
                    {type.toString().toUpperCase()}
                </td>
                <td>
                    <code>{token(order.amount, tokenData.decimals)}</code>{" "}
                    {tokenData.symbol}
                </td>
                <td
                    style={{
                        opacity: "0.3",
                        textAlign: "center",
                    }}
                >
                    @
                </td>
                <td>
                    <code>
                        {token(order.price, paymentTokenDataData.decimals)}
                    </code>{" "}
                    {paymentTokenDataData.symbol}
                </td>
                <td style={{ textAlign: "right" }}>
                    <Button
                        onClick={async () => {
                            await window.api.close_order(
                                Principal.fromText(tokenId),
                                type,
                                order.amount,
                                order.price,
                                order.timestamp,
                            );
                            await loadData();
                            callback();
                        }}
                        label="CLOSE"
                    />
                </td>
            </tr>
        ));

    const render = (orders: Order[], orderType: OrderType) =>
        orders.length == 0 ? null : (
            <div
                className="column_container max_width_col bottom_spaced"
                style={{
                    alignItems:
                        orderType == OrderType.Buy ? "flex-end" : "flex-start",
                    paddingLeft: orderType == OrderType.Sell ? "0.4em" : "0",
                    paddingRight: orderType == OrderType.Buy ? "0.4em" : "0",
                }}
            >
                <br />
                <div
                    style={{
                        color: orderType == OrderType.Buy ? "green" : "red",
                        textAlign:
                            orderType == OrderType.Buy ? "right" : "left",
                    }}
                >
                    <h3>{orderType == OrderType.Buy ? "BUYERS" : "SELLERS"}</h3>
                    <h4>
                        {orderType == OrderType.Buy ? (
                            <>
                                {token(
                                    orders.reduce(
                                        (acc, order) =>
                                            acc +
                                            Number(order.amount * order.price) /
                                                tokenBase(tokenId),
                                        0,
                                    ),
                                    paymentTokenDataData.decimals,
                                ).toLocaleString()}{" "}
                                {paymentTokenDataData.symbol}
                            </>
                        ) : (
                            <>
                                {token(
                                    orders.reduce(
                                        (acc, order) => acc + order.amount,
                                        BigInt(0),
                                    ),
                                    tokenData.decimals,
                                ).toLocaleString()}{" "}
                                {tokenData.symbol}
                            </>
                        )}
                    </h4>
                </div>
                {orders.map((order, i) => (
                    <div
                        key={i}
                        className="column_container"
                        style={{
                            width: "100%",
                            alignItems:
                                orderType == OrderType.Buy
                                    ? "flex-end"
                                    : "flex-start",
                            fontSize: "small",
                            color: orderType == OrderType.Buy ? "green" : "red",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                paddingLeft: "0.5em",
                                paddingRight: "0.5em",
                            }}
                        >
                            {token(
                                order.price,
                                window.tokenData[PAYMENT_TOKEN_ID].decimals,
                            )}{" "}
                            {window.tokenData[PAYMENT_TOKEN_ID].symbol}
                        </div>
                        <div
                            style={{
                                width: `${
                                    (Number(order.amount) / maxOrderSize) * 100
                                }%`,
                                color: "white",
                                fontSize: "small",
                                paddingLeft: "0.5em",
                                paddingRight: "0.5em",
                                boxSizing: "border-box",
                                direction:
                                    orderType == OrderType.Buy
                                        ? "rtl"
                                        : undefined,
                                background:
                                    orderType == OrderType.Buy
                                        ? "#008800"
                                        : "#cc0000",
                            }}
                        >
                            {token(
                                order.amount,
                                window.tokenData[tokenId].decimals,
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );

    return (
        <>
            <div className="row_container">
                {render(buyOrders, OrderType.Buy)}
                {render(sellOrders, OrderType.Sell)}
            </div>
            {(userOrders.buy.length > 0 || userOrders.sell.length > 0) && (
                <>
                    <h2>YOUR STANDING ORDERS</h2>
                    <table>
                        <tbody>
                            {userOrdersList(userOrders.buy, OrderType.Buy)}
                            {userOrdersList(userOrders.sell, OrderType.Sell)}
                        </tbody>
                    </table>
                    <br />
                </>
            )}
        </>
    );
};
