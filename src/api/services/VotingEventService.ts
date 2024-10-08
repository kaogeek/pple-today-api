/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { VotingEventRepository } from '../repositories/VotingEventRepository';
@Service()
export class VotingEventService {

    constructor(
        @OrmRepository() private votingEventRepository: VotingEventRepository,
        ) {
    }

    // create Device token and find the user who is login !!!!!
    public async create(data: any): Promise<any> {
        console.log('Create a voting event.');
        return await this.votingEventRepository.save(data);
    }

    public async findOne(findCondition: any): Promise<any> {
        return await this.votingEventRepository.findOne(findCondition);
    }

    public async find(findCondition?: any): Promise<any> {
        return await this.votingEventRepository.find(findCondition);
    }

    public async delete(query: any, options?: any): Promise<any> {
        console.log('Delete a voting event.');
        return await this.votingEventRepository.deleteOne(query, options);
    }
    public async deleteMany(query: any, options?: any): Promise<any> {
        return await this.votingEventRepository.deleteMany(query, options);
    }
    public async update(query: any, newValue: any): Promise<any> {
        console.log('Update a voting event.');

        return await this.votingEventRepository.updateOne(query, newValue);
    }

        // update many post
    public async updateMany(query: any, newValue: any, options?: any): Promise<any> {
        return await this.votingEventRepository.updateMany(query, newValue, options);
    }

    public async aggregate(query: any, options?: any): Promise<any[]> {
        return await this.votingEventRepository.aggregate(query, options).toArray();
    }
}
