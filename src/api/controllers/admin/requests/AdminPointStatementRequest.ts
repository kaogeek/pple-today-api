/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { IsNotEmpty , IsNumber } from 'class-validator';

export class AdminPointStatementRequest {

    @IsNotEmpty({ message: 'point is required' })
    @IsNumber()
    public point:number;

}
