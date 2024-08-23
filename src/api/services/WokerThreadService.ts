/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { WorkerThreadRepository } from '../repositories/WokerThreadRepository';
@Service()
export class WorkerThreadService {

    constructor(
        @OrmRepository() private workerThreadRepository: WorkerThreadRepository,
        @Logger(__filename) private log: LoggerInterface) {
    }

    // create Device token and find the user who is login !!!!!
    public async create(data: any): Promise<any> {
        this.log.info('Create a worker thread.');
        return await this.workerThreadRepository.save(data);
    }

    public async findOne(findCondition: any): Promise<any> {
        return await this.workerThreadRepository.findOne(findCondition);
    }

    public async find(findCondition?: any): Promise<any> {
        return await this.workerThreadRepository.find(findCondition);
    }

    public async delete(query: any, options?: any): Promise<any> {
        this.log.info('Delete a worker thread.');
        return await this.workerThreadRepository.deleteOne(query, options);
    }
    public async deleteMany(query: any, options?: any): Promise<any> {
        return await this.workerThreadRepository.deleteMany(query, options);
    }
    public async update(query: any, newValue: any): Promise<any> {
        this.log.info('Update a worker thread.');

        return await this.workerThreadRepository.updateOne(query, newValue);
    }

        // update many post
    public async updateMany(query: any, newValue: any, options?: any): Promise<any> {
        return await this.workerThreadRepository.updateMany(query, newValue, options);
    }

    public async aggregate(query: any, options?: any): Promise<any[]> {
        return await this.workerThreadRepository.aggregate(query, options).toArray();
    }
}
