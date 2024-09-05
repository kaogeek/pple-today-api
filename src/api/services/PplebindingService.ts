/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { PplebindingRepository } from '../repositories/PplebindingRepository';
@Service()
export class PplebindingService {

    constructor(
        @OrmRepository() private pplebindingRepository: PplebindingRepository,
        @Logger(__filename) private log: LoggerInterface) {
    }

    public async create(data: any): Promise<any> {
        this.log.info('Create Pple binding.');
        return await this.pplebindingRepository.save(data);
    }

    public async findOne(findCondition: any): Promise<any> {
        return await this.pplebindingRepository.findOne(findCondition);
    }

    public async find(findCondition?: any): Promise<any> {
        return await this.pplebindingRepository.find(findCondition);
    }

    public async delete(query: any, options?: any): Promise<any> {
        this.log.info('Delete a Pple binding.');
        return await this.pplebindingRepository.deleteOne(query, options);
    }

    public async deleteMany(query: any, options?: any): Promise<any> {
        return await this.pplebindingRepository.deleteMany(query, options);
    }
    public async update(query: any, newValue: any): Promise<any> {
        this.log.info('Update a Pple binding.');

        return await this.pplebindingRepository.updateOne(query, newValue);
    }
}
