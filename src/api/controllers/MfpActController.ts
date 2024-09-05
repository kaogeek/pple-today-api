/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import {
  JsonController,
  Res,
  Post,
  Get,
  Req,
  Authorized,
} from 'routing-controllers';
import moment from 'moment';
import { PplebindingService } from '../services/PplebindingService';
import { ResponseUtil } from '../../utils/ResponseUtil';
import jwt from 'jsonwebtoken';
import { Pplebinding } from '../models/PplebindingModel';
import { ObjectID } from 'mongodb';
import { UserService } from '../services/UserService';
import { AuthenticationIdService } from '../services/AuthenticationIdService';
import { AuthenticationId } from '../models/AuthenticationId';
import { PROVIDER } from '../../constants/LoginProvider';
import { ConfigService } from '../services/ConfigService';
import {
  USER_EXPIRED_TIME_CONFIG,
  DEFAULT_USER_EXPIRED_TIME,
} from '../../constants/SystemConfig';
@JsonController('/binding/mfp')
export class AssetController {
  constructor(
    private authenticationIdService:AuthenticationIdService,
    private pplebindingService: PplebindingService,
    private userService: UserService,
    private configService:ConfigService
  ) {}

  @Post('/sign')
  public async testSignToken(@Res() res: any, @Req() req: any): Promise<any> {
    const today = new Date();
    const bodyRest: any = {};
    bodyRest.phone = req.body.phone;
    bodyRest.users = req.body.users;
    bodyRest.act_id = req.body.act_id;
    bodyRest.isBinding = req.body.isBinding;
    bodyRest.expire_at = new Date(
      today.getTime() + today.getMinutes() * 60 * 60
    );
    const token: any = jwt.sign({ id: bodyRest }, process.env.SECRET_MFP_ACT);
    const successResponse = ResponseUtil.getSuccessResponse(
      'Successfully sign token.',
      token
    );
    return res.status(200).send(successResponse);
  }

  @Post('/today')
  public async bindingMfpToday(@Res() res: any, @Req() req: any): Promise<any> {
    try {
      const today = new Date();
      let successResponse: any;
      const verifyToken: any = jwt.verify(
        req.body.token,
        process.env.SECRET_MFP_ACT
      );
      const users: any = await this.userService.findOne({
        where: { _id: new ObjectID(verifyToken.id.users) },
      });
      if (users === undefined) {
        successResponse = ResponseUtil.getErrorResponse(
          'User not found.',
          null
        );
        return res.status(400).send(successResponse);
      }

      if (users.banned === true) {
        successResponse = ResponseUtil.getErrorResponse(
          'User had banned.',
          null
        );
        return res.status(400).send(successResponse);
      }
      // where:{actId:String(verifyToken.id.act_id)}
      const mfpAct: any = await this.pplebindingService.findOne({
        $or: [
          { users: ObjectID(verifyToken.id.users) },
          { phone: Number(verifyToken.id.phone) },
        ],
      });
      if (mfpAct !== undefined) {
        const query = { _id: ObjectID(mfpAct.id) };
        const newValues = {
          $set: {
            actId: String(verifyToken.id.act_id),
            phone: Number(verifyToken.id.phone),
            users: ObjectID(verifyToken.id.users),
          },
        };
        const update: any = await this.pplebindingService.update(query, newValues);
        if (update) {
          const findUpdated: any = await this.pplebindingService.findOne({
            where: {
              users: ObjectID(verifyToken.id.users),
              actId: String(verifyToken.id.act_id),
              phone: Number(verifyToken.id.phone),
            },
          });
          successResponse = ResponseUtil.getSuccessResponse(
            'Successfully binding mfp today.',
            findUpdated
          );
          return res.status(200).send(successResponse);
        }
      }

      if (today.getTime() > new Date(verifyToken.id.expire_at).getTime()) {
        successResponse = ResponseUtil.getErrorResponse(
          'token is expired.',
          null
        );
        return res.status(400).send(successResponse);
      }

      if (verifyToken.id.phone < 10) {
        successResponse = ResponseUtil.getErrorResponse(
          'Phone Number must equal 10.',
          null
        );
        return res.status(400).send(successResponse);
      }

      if (verifyToken.id.isBinding !== true) {
        successResponse = ResponseUtil.getErrorResponse(
          'Is binding must be true',
          null
        );
        return res.status(400).send(successResponse);
      }
      // MFP ACT
      const userExrTime = await this.getUserLoginExpireTime();
      const pplebinding:any = new Pplebinding();
      pplebinding.phone = Number(verifyToken.id.phone);
      pplebinding.users = new ObjectID(verifyToken.id.users);
      pplebinding.actId = String(verifyToken.id.act_id);
      pplebinding.isBinding = verifyToken.id.isBinding;
      const createBinding = await this.pplebindingService.create(pplebinding);
      const authenId = new AuthenticationId();
      authenId.user = users.id;
      authenId.lastAuthenTime = moment().toDate();
      authenId.providerUserId = verifyToken.id.act_id;
      authenId.providerName = PROVIDER.ACT;
      authenId.storedCredentials = null;
      authenId.properties = {};
      authenId.expirationDate = moment().add(userExrTime, 'days').toDate();
      await this.authenticationIdService.create(authenId);

      successResponse = ResponseUtil.getSuccessResponse(
        'Successfully binding mfp today.',
        createBinding
      );
      return res.status(200).send(successResponse);
    } catch (err) {
      const successResponse = ResponseUtil.getErrorResponse(
        'Invalid sign token.',
        err
      );
      return res.status(401).send(successResponse);
    }
  }

  @Get('/:id')
  @Authorized('user')
  public async isBinding(@Res() res: any, @Req() req: any): Promise<any> {
    const userId = new ObjectID(req.user.id);
    let successResponse: any;
    const mfpAct: any = await this.pplebindingService.findOne({
      where: { users: userId },
    });
    if (mfpAct === undefined) {
      successResponse = ResponseUtil.getErrorResponse(
        'Binding is not found.',
        null
      );
      return res.status(400).send(successResponse);
    }
    const users: any = await this.userService.findOne({
      where: { _id: new ObjectID(userId) },
    });
    if (users.banned === true) {
      successResponse = ResponseUtil.getErrorResponse('User had banned.', null);
      return res.status(400).send(successResponse);
    }
    successResponse = ResponseUtil.getSuccessResponse(
      'Get binding status is sucess.',
      mfpAct
    );
    return res.status(200).send(successResponse);
  }

  private async getUserLoginExpireTime(): Promise<number> {
    let value = await this.configService.getConfig(USER_EXPIRED_TIME_CONFIG);
    if (value === undefined || value === null || isNaN(value) || value === '') {
      value = DEFAULT_USER_EXPIRED_TIME;
    }

    return value;
  }
}
