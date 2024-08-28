/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { IsReadPostRepository } from '../repositories/IsReadRepository';
@Service()
export class IsReadPostService {

    constructor(
        @OrmRepository() private isReadPostRepository: IsReadPostRepository,
        ) {
    }

    // create Device token and find the user who is login !!!!!
    public async create(data: any): Promise<any> {
        console.log('Create is Read.');
        return await this.isReadPostRepository.save(data);
    }

    public async findOne(findCondition: any): Promise<any> {
        return await this.isReadPostRepository.findOne(findCondition);
    }

    public async find(findCondition?: any): Promise<any> {
        return await this.isReadPostRepository.find(findCondition);
    }

    public async delete(query: any, options?: any): Promise<any> {
        console.log('Delete a is read.');
        return await this.isReadPostRepository.deleteOne(query, options);
    }

    public async deleteMany(query: any, options?: any): Promise<any> {
        console.log('Delete a is read.');
        return await this.isReadPostRepository.deleteMany(query, options);
    }

    public async updateToken(query: any, newValue: any): Promise<any> {
        console.log('Update a is read.');

        return await this.isReadPostRepository.updateOne(query, newValue);
    }

    public async aggregate(query: any, options?: any): Promise<any[]> {
        return await this.isReadPostRepository.aggregate(query, options).toArray();
    }
    public async findOneAndUpdate(query: any, update: any, options?: any): Promise<any> {
        return await this.isReadPostRepository.findOneAndUpdate(query, update, options);
    }
}
