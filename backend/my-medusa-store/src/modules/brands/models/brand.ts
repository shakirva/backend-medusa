import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Brand {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo_url: string;
}