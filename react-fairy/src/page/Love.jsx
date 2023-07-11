import React from 'react'


// 비회원 상태에서 찜목록이 창을 닫으면 날아가고 로그인을 하면 연결이 되게 ?

const Love = () => {
 
  
  return (
    <div className='cart'>
                <nav>
                    <h1>장바구니</h1>
                    <p>
                        HOME 
                        <span>패션·의류·뷰티</span>
                        <strong>장바구니</strong>
                    </p>
                </nav>
               <form action="#!">
                    <table border="3">
                        <tr>
                            <th><input type="checkbox" name="all" /></th>
                            <th>상품명</th>
                            <th>총수량</th>
                            <th>판매가</th>
                            <th>할인</th>
                            <th>포인트</th>
                            <th>배송비</th>
                            <th>소계</th>
                        </tr>
                        <tr class="empty">
                            <td colspan="7">장바구니에 상품이 없습니다.</td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" name="1" /></td>
                            <td><article>
                                <a href="#!">
                                    <img src="	https://via.placeholder.com/80x80" alt="1" />
                                </a>
                                <div>
                                    <h2><a href="#!">상품명</a></h2>
                                    <p>상품설명</p>
                                </div>
                            </article></td>
                            <td>1</td>
                            <td>27,000</td>
                            <td>5%</td>
                            <td>270</td>
                            <td>무료배송</td>
                            <td>27,000</td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" name="1" /></td>
                            <td><article>
                                <a href="#!">
                                    <img src="	https://via.placeholder.com/80x80" alt="1" />
                                </a>
                                <div>
                                    <h2><a href="#!">상품명</a></h2>
                                    <p>상품설명</p>
                                </div>
                            </article></td>
                            <td>1</td>
                            <td>27,000</td>
                            <td>5%</td>
                            <td>270</td>
                            <td>무료배송</td>
                            <td>27,000</td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" name="1"/></td>
                            <td><article>
                                <a href="#!">
                                    <img src="	https://via.placeholder.com/80x80" alt="1"/>
                                </a>
                                <div>
                                    <h2><a href="#!">상품명</a></h2>
                                    <p>상품설명</p>
                                </div>
                            </article></td>
                            <td>1</td>
                            <td>27,000</td>
                            <td>5%</td>
                            <td>270</td>
                            <td>무료배송</td>
                            <td>27,000</td>
                        </tr>
                    </table>
                    <input type="button" name="del" value="선택삭제"/>
                    <div class="total">
                        <h2>전체합계</h2>
                        <table>
                            <tr>
                                <td>상품수</td>
                                <td>1</td>
                            </tr>
                            <tr>
                                <td>상품금액</td>
                                <td>27,000</td>
                            </tr>
                            <tr>
                                <td>할인금액</td>
                                <td>-1,000</td>
                            </tr>
                            <tr>
                                <td>배송비</td>
                                <td>0</td>
                            </tr>
                            <tr>
                                <td>포인트</td>
                                <td>260</td>
                            </tr>
                            <tr>
                                <td>전체주문금액</td>
                                <td>26,000</td>
                            </tr>
                        </table>
                        <input type="submit" value="주문하기"/>
                        <input type="submit" value="하 머가문제인데 안되냐GG"/>
                    </div>
               </form>
               </div>
            
  )
}

export default Love
