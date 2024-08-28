/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { CacheRepository } from '../repositories/CacheRepository';
@Service()
export class CacheService {

    constructor(
        @OrmRepository() private cacheRepository: CacheRepository,
        @Logger(__filename) private log: LoggerInterface) {
    }

    // create Device token and find the user who is login !!!!!
    public async create(data: any): Promise<any> {
        this.log.info('Create a cache.');
        return await this.cacheRepository.save(data);
    }

    public async findOne(findCondition: any): Promise<any> {
        return await this.cacheRepository.findOne(findCondition);
    }

    public async find(findCondition?: any): Promise<any> {
        return await this.cacheRepository.find(findCondition);
    }

    public async delete(query: any, options?: any): Promise<any> {
        this.log.info('Delete a cache.');
        return await this.cacheRepository.deleteOne(query, options);
    }
    public async deleteMany(query: any, options?: any): Promise<any> {
        return await this.cacheRepository.deleteMany(query, options);
    }
    public async update(query: any, newValue: any): Promise<any> {
        this.log.info('Update a cache.');

        return await this.cacheRepository.updateOne(query, newValue);
    }

        // update many post
    public async updateMany(query: any, newValue: any, options?: any): Promise<any> {
        return await this.cacheRepository.updateMany(query, newValue, options);
    }

    public async aggregate(query: any, options?: any): Promise<any[]> {
        return await this.cacheRepository.aggregate(query, options).toArray();
    }
}
