/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { IsNotEmpty, IsString } from 'class-validator';

export class AdminAccumulatePointRequest {

    @IsNotEmpty({ message: 'point is required' })
    public point: number;

    @IsNotEmpty()
    @IsString()
    public userId: string;

    public id: string;
}
