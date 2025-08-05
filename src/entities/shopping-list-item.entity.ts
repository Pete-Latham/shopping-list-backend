import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { ShoppingList } from './shopping-list.entity';

@Entity('shopping_list_items')
export class ShoppingListItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => ShoppingList, shoppingList => shoppingList.items)
  shoppingList: ShoppingList;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
